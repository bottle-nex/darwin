import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    orgId: z.string(),
    teamId: z.string().optional(),
    userIds: z.array(z.string()).min(1).max(100),
});

export default class RemoveMembersController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "invalid_data");
        }

        try {
            const { orgId, teamId, userIds } = parsed.data;
            const requested_ids = [...new Set(userIds)];

            if (teamId) {
                // Team-level removal: drop only this team's membership. Validate the
                // team belongs to the org so a team from another org can't be targeted.
                const team = await prisma.team.findFirst({
                    where: { id: teamId, project: { orgId } },
                    select: { id: true },
                });
                if (!team) {
                    return ResponseWriter.not_found(res, "team not found in this organization");
                }

                await prisma.teamMember.deleteMany({
                    where: { teamId, userId: { in: requested_ids } },
                });
            } else {
                // Org-level removal: drop org membership AND every team membership in
                // this org (no FK cascade exists between OrgMember and TeamMember).
                await prisma.$transaction([
                    prisma.teamMember.deleteMany({
                        where: { userId: { in: requested_ids }, team: { project: { orgId } } },
                    }),
                    prisma.orgMember.deleteMany({
                        where: { orgId, userId: { in: requested_ids } },
                    }),
                ]);
            }

            return ResponseWriter.success(res, { removed: requested_ids }, "members removed");
        } catch (error) {
            console.error("error in RemoveMembersController", error);
            ResponseWriter.system_error(res);
        }
    }
}
