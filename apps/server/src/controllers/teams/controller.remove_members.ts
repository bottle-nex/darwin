import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { server_services } from "../..";

const body_schema = z.object({
    orgId: z.string(),
    teamId: z.string().optional(),
    userIds: z.array(z.string()).min(1).max(100),
});

export default class RemoveMembersController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            ResponseWriter.invalid_data(res, "invalid_data");
            return;
        }

        try {
            const { orgId, teamId, userIds } = parsed.data;
            const requested_ids = [...new Set(userIds)];

            if (teamId) {
                const team = await prisma.team.findFirst({
                    where: {
                        id: teamId,
                        project: {
                            orgId,
                        },
                    },
                    select: {
                        id: true,
                        projectId: true,
                    },
                });
                if (!team) {
                    ResponseWriter.not_found(res, "team not found in this organization");
                    return;
                }

                const role = await Access.project(req.user.id, team.projectId);
                if (!role || !Permissions.project(role, Action.project.manage_team)) {
                    ResponseWriter.not_authorized(res, "insufficient permissions", 403);
                    return;
                }

                const removed = await prisma.teamMember.findMany({
                    where: { teamId, userId: { in: requested_ids } },
                    select: { userId: true },
                });

                await prisma.teamMember.deleteMany({
                    where: { teamId, userId: { in: requested_ids } },
                });

                for (const member of removed) {
                    if (member.userId === req.user.id) continue;
                    await server_services.notifications.enqueue({
                        action: "member.removed_from_team",
                        teamId,
                        recipientId: member.userId,
                        actorId: req.user.id,
                    });
                }
            } else {
                const role = await Access.org(req.user.id, orgId);
                if (!role || !Permissions.org(role, Action.org.remove_member)) {
                    ResponseWriter.not_authorized(res, "insufficient permissions", 403);
                    return;
                }

                const removed = await prisma.orgMember.findMany({
                    where: { orgId, userId: { in: requested_ids } },
                    select: { userId: true },
                });

                await prisma.$transaction([
                    prisma.teamMember.deleteMany({
                        where: {
                            userId: {
                                in: requested_ids,
                            },
                            team: {
                                project: {
                                    orgId,
                                },
                            },
                        },
                    }),
                    prisma.orgMember.deleteMany({
                        where: {
                            orgId,
                            userId: {
                                in: requested_ids,
                            },
                        },
                    }),
                ]);

                for (const member of removed) {
                    if (member.userId === req.user.id) continue;
                    await server_services.notifications.enqueue({
                        action: "member.removed_from_org",
                        orgId,
                        recipientId: member.userId,
                        actorId: req.user.id,
                    });
                }
            }

            ResponseWriter.success(res, { removed: requested_ids }, "members removed");
            return;
        } catch (error) {
            console.error("error in RemoveMembersController", error);
            ResponseWriter.system_error(res);
        }
    }
}
