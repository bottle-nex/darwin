import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";

const params_schema = z.object({
    teamId: z.string(),
});

export default class GetTeamMembersController {
    static async process(req: Request, res: Response) {
        const parsed = params_schema.safeParse(req.params);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "Invalid team id");
        }

        try {
            const { teamId } = parsed.data;
            const userId = req.user.id;

            const team = await prisma.team.findUnique({
                where: { id: teamId },
                select: { projectId: true },
            });
            if (!team) {
                return ResponseWriter.not_found(res, "Team not found");
            }

            const role = await Access.project(userId, team.projectId);
            if (!role || !Permissions.project(role, Action.project.read)) {
                return ResponseWriter.not_authorized(res, "You don't have access to this team");
            }

            const members = await prisma.teamMember.findMany({
                where: { teamId },
                select: {
                    id: true,
                    role: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                },
                orderBy: { createdAt: "asc" },
            });

            ResponseWriter.success(res, { members });
        } catch (error) {
            console.error("error in get_team_members controller:", error);
            ResponseWriter.system_error(res);
        }
    }
}
