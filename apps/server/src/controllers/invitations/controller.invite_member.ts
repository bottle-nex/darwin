import { Request, Response } from "express";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { InvitationStatus, Prisma, prisma, ProjectRole } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";
import { ENV } from "../../configs/env";
import { inviteMember } from "../../services/service.email";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";

const body_schema = z
    .object({
        emails: z.array(z.email()).min(1).max(50),
        orgId: z.string(),
        projectId: z.string().optional(),
        teamId: z.string().optional(),
        role: z.enum(ProjectRole).optional(),
        message: z.string().trim().max(500).optional(),
    })
    .refine((d) => Boolean(d.projectId) === Boolean(d.teamId), {
        message: "projectId and teamId must be provided together",
        path: ["teamId"],
    })
    .refine((d) => Boolean(d.projectId) === Boolean(d.role), {
        message: "role must be provided when inviting to a project",
        path: ["role"],
    });

export default class InviteMembersController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "invalid_data");
        }

        try {
            const { emails, orgId, projectId, teamId, role, message } = parsed.data;
            const invitedById = req.user.id;
            const is_team_invite = Boolean(teamId);

            if (teamId) {
                // Inviting into a team is project-level management — project Admins only.
                const role = await Access.project(invitedById, projectId!);
                if (!role || !Permissions.project(role, Action.project.manage_team)) {
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

            const requested_emails = [...new Set(emails.map((e) => e.toLowerCase()))];
            const users = await prisma.user.findMany({
                where: { email: { in: requested_emails } },
                select: { id: true, email: true },
            });
            const user_by_email = new Map(users.map((u) => [u.email, u]));
            const user_ids = users.map((u) => u.id);

            const [members, existing_invites] = await Promise.all([
                is_team_invite
                    ? prisma.teamMember.findMany({
                          where: { teamId: team!.id, userId: { in: user_ids } },
                          select: { userId: true },
                      })
                    : prisma.orgMember.findMany({
                          where: { orgId, userId: { in: user_ids } },
                          select: { userId: true },
                      }),
                // Any status, not just Pending: a leftover Rejected/Accepted row for
                // the same (email, orgId, teamId) tuple would collide on insert, so we
                // resolve its id here and refresh it in place instead.
                prisma.invitation.findMany({
                    where: { orgId, teamId: teamId ?? null, email: { in: requested_emails } },
                    select: { id: true, email: true },
                }),
            ]);
            const member_ids = new Set(members.map((m) => m.userId));
            const existing_by_email = new Map(existing_invites.map((i) => [i.email, i]));

            const expires_at = new Date(
                Date.now() + ENV.INVITATION_URL_TTL_DAYS * 24 * 60 * 60 * 1000,
            );

            const invited: string[] = [];
            const failed: { email: string; reason: string }[] = [];
            const to_process: {
                email: string;
                raw_token: string;
                existingId: string | null;
                db_record: Prisma.InvitationUncheckedCreateInput;
            }[] = [];

            for (const email of requested_emails) {
                const user = user_by_email.get(email);
                // An active membership always wins over a stale invite row.
                if (user && member_ids.has(user.id)) {
                    failed.push({ email, reason: "already_member" });
                    continue;
                }

                const raw_token = randomBytes(32).toString("hex");
                const token = createHash("sha256").update(raw_token).digest("hex");
                const existing = existing_by_email.get(email);

                to_process.push({
                    email,
                    raw_token,
                    existingId: existing?.id ?? null,
                    db_record: {
                        email,
                        userId: user?.id ?? null,
                        token,
                        status: InvitationStatus.Pending,
                        orgId,
                        projectId: projectId ?? null,
                        role: role ?? null,
                        teamId: teamId ?? null,
                        invitedById,
                        expiresAt: expires_at,
                    },
                });
            }

            if (to_process.length > 0) {
                const email_results = await Promise.allSettled(
                    to_process.map(({ email, raw_token }) =>
                        inviteMember(
                            email,
                            `${ENV.SERVER_WEB_URL}/invite/${raw_token}`,
                            team
                                ? { type: "team", teamName: team.name, orgName: organization.name }
                                : { type: "org", orgName: organization.name },
                            { inviter: req.user.name || req.user.email, message },
                        ),
                    ),
                );

                // Persist one row at a time so a single collision can't abort the
                // whole batch. Refresh an existing row in place, otherwise create.
                const persisted = await Promise.all(
                    email_results.map(async (result, i) => {
                        const { email, existingId, db_record } = to_process[i];
                        if (!(result.status === "fulfilled" && result.value)) {
                            return { email, ok: false as const, reason: "email_failed" };
                        }
                        try {
                            if (existingId) {
                                await prisma.invitation.update({
                                    where: { id: existingId },
                                    data: {
                                        token: db_record.token,
                                        status: InvitationStatus.Pending,
                                        expiresAt: db_record.expiresAt,
                                        userId: db_record.userId,
                                        invitedById,
                                        projectId: db_record.projectId,
                                        role: db_record.role,
                                    },
                                });
                            } else {
                                await prisma.invitation.create({ data: db_record });
                            }
                            return { email, ok: true as const };
                        } catch (err) {
                            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                                if (err.code === "P2002") {
                                    return { email, ok: false as const, reason: "already_invited" };
                                }
                                if (err.code === "P2025") {
                                    return { email, ok: false as const, reason: "persist_failed" };
                                }
                            }
                            throw err;
                        }
                    }),
                );

                for (const row of persisted) {
                    if (row.ok) invited.push(row.email);
                    else failed.push({ email: row.email, reason: row.reason });
                }
            }

            return ResponseWriter.success(res, { invited, failed }, "invitations processed");
        } catch (error) {
            console.error("failed at InviteMembersController", error);
            ResponseWriter.system_error(res);
        }
    }
}
