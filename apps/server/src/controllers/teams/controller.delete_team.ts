import { Request, Response } from "express";
import { z } from "zod";
import { Prisma, prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";

const params_schema = z.object({
    teamId: z.string(),
});

export default class DeleteTeamController {
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
            if (!role || !Permissions.project(role, Action.project.manage_team)) {
                return ResponseWriter.not_authorized(res, "insufficient permissions", 403);
            }

            await prisma.team.delete({ where: { id: teamId } });

            return ResponseWriter.success(res, {}, "Team deleted successfully.");
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                return ResponseWriter.not_found(res, "Team not found");
            }
            console.error("error in delete_team controller:", error);
            return ResponseWriter.system_error(res);
        }
    }
}
