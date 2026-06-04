import { Request, Response } from "express";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { InvitationStatus, Prisma, prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";
import { ENV } from "../../configs/env";
import { inviteMember } from "../../services/service.email";
import Access from "../../access-control/access";
import Permissions from "../../access-control/permissions";
import Action from "../../access-control/actions";

const body_schema = z
    .object({
        emails: z.array(z.email()).min(1).max(50),
        orgId: z.string(),
        projectId: z.string().optional(),
        teamId: z.string().optional(),
    })
    // A team invite needs the full org > project > team chain; an org invite has
    // neither. Reject the half-specified cases (only one of project/team).
    .refine((d) => Boolean(d.projectId) === Boolean(d.teamId), {
        message: "projectId and teamId must be provided together",
        path: ["teamId"],
    });

export default class InviteMembersController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "invalid_data");
        }

        try {
            const { emails, orgId, projectId, teamId } = parsed.data;
            const invitedById = req.user.id;
            const is_team_invite = Boolean(teamId);

            // Team invites need team add_member; org invites need org invite_member.
            if (teamId) {
                const role = await Access.team(invitedById, teamId);
                if (!role || !Permissions.team(role, Action.team.add_member)) {
                    return ResponseWriter.not_authorized(res, "insufficient permissions", 403);
                }
            } else {
                const role = await Access.org(invitedById, orgId);
                if (!role || !Permissions.org(role, Action.org.invite_member)) {
                    return ResponseWriter.not_authorized(res, "insufficient permissions", 403);
                }
            }

            const organization = await prisma.organization.findUnique({
                where: { id: orgId },
                select: { id: true, name: true },
            });
            if (!organization) {
                return ResponseWriter.not_found(res, "organization not found");
            }

            // Validate the full org > project > team chain so a caller authorized on
            // this org can't invite into a team that lives under a different org/project.
            let team: { id: string; name: string } | null = null;
            if (teamId) {
                team = await prisma.team.findFirst({
                    where: { id: teamId, projectId, project: { orgId } },
                    select: { id: true, name: true },
                });
                if (!team) {
                    return ResponseWriter.not_found(res, "team not found in this project");
                }
            }

            const requested_emails = [...new Set(emails)];
            const users = await prisma.user.findMany({
                where: { email: { in: requested_emails } },
                select: { id: true, email: true },
            });
            const user_by_email = new Map(users.map((u) => [u.email, u]));
            const user_ids = users.map((u) => u.id);

            // Anyone already in the target scope, and anyone already holding a live
            // invite to it, is skipped rather than re-invited.
            const [members, pending_invites] = await Promise.all([
                is_team_invite
                    ? prisma.teamMember.findMany({
                          where: { teamId: team!.id, userId: { in: user_ids } },
                          select: { userId: true },
                      })
                    : prisma.orgMember.findMany({
                          where: { orgId, userId: { in: user_ids } },
                          select: { userId: true },
                      }),
                prisma.invitation.findMany({
                    where: {
                        orgId,
                        teamId: teamId ?? null,
                        status: InvitationStatus.Pending,
                        userId: { in: user_ids },
                    },
                    select: { userId: true },
                }),
            ]);
            const member_ids = new Set(members.map((m) => m.userId));
            const pending_ids = new Set(pending_invites.map((i) => i.userId));

            const expires_at = new Date(
                Date.now() + ENV.INVITATION_URL_TTL_DAYS * 24 * 60 * 60 * 1000,
            );

            const invited: string[] = [];
            const failed: { email: string; reason: string }[] = [];
            const to_create: Prisma.InvitationCreateManyInput[] = [];
            const to_email: { email: string; token: string }[] = [];

            for (const email of requested_emails) {
                const user = user_by_email.get(email);
                if (!user) {
                    failed.push({ email, reason: "no_account" });
                    continue;
                }
                if (member_ids.has(user.id)) {
                    failed.push({ email, reason: "already_member" });
                    continue;
                }
                if (pending_ids.has(user.id)) {
                    failed.push({ email, reason: "already_invited" });
                    continue;
                }

                // The raw token goes in the email URL; only its SHA-256 hash is
                // stored, so a DB leak can't be used to accept invites. The token is
                // already high-entropy, so a fast deterministic hash (indexable for
                // single-query lookup) is enough — no bcrypt needed.
                const raw_token = randomBytes(32).toString("hex");
                const token = createHash("sha256").update(raw_token).digest("hex");
                to_create.push({
                    email,
                    userId: user.id,
                    token,
                    orgId,
                    teamId: teamId ?? null,
                    invitedById,
                    expiresAt: expires_at,
                });
                to_email.push({ email, token: raw_token });
                invited.push(email);
            }

            if (to_create.length > 0) {
                await prisma.invitation.createMany({ data: to_create });

                // Fire-and-forget: the invite rows are committed, so don't block the
                // response on email delivery. Failures only get logged (and can be
                // resent later) — they were never part of the response anyway.
                void Promise.allSettled(
                    to_email.map(({ email, token }) =>
                        inviteMember(
                            email,
                            `${ENV.SERVER_WEB_URL}/invite/${token}`,
                            team
                                ? { type: "team", teamName: team.name, orgName: organization.name }
                                : { type: "org", orgName: organization.name },
                        ),
                    ),
                ).then((results) => {
                    results.forEach((r, i) => {
                        if (r.status === "rejected") {
                            console.error(`invite email failed for ${to_email[i].email}`, r.reason);
                        }
                    });
                });
            }

            return ResponseWriter.success(res, { invited, failed }, "invitations processed");
        } catch (error) {
            console.error("failed at InviteMembersController", error);
            ResponseWriter.system_error(res);
        }
    }
}
