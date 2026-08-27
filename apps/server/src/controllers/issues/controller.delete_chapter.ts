import { Action, Permissions } from "@trymatcha/access-control";
import { IssueStatus, prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";

export default class ChapterDeleteController {
    static params_schema = z.object({ id: z.string().min(1) });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params_data, success } = ChapterDeleteController.params_schema.safeParse(
            req.params,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const chapter = await prisma.chapter.findUnique({
                where: { id: params_data.id },
                select: { projectId: true },
            });
            if (!chapter) {
                ResponseWriter.not_found(res, "Chapter not found");
                return;
            }

            const role = await Access.project(user.id, chapter.projectId);
            if (!role || !Permissions.project(role, Action.project.manage_columns)) {
                ResponseWriter.not_authorized(res, "You dont have access to the project");
                return;
            }

            // Both cascades below the chapter are destructive: Chapter deletes its
            // CustomColumns, and CustomColumn deletes the Issues parked in them.
            // Detaching first sends those issues back to the agent board instead.
            // `Parked` is not a board status, so the status reset is required too.
            const { deleted_columns, released_issues } = await prisma.$transaction(async (tx) => {
                const deleted_columns = await tx.customColumn.count({
                    where: { chapterId: params_data.id },
                });
                const released = await tx.issue.updateMany({
                    where: { customColumn: { chapterId: params_data.id } },
                    data: { customColumnId: null, status: IssueStatus.Todo },
                });
                await tx.chapter.delete({ where: { id: params_data.id } });
                return { deleted_columns, released_issues: released.count };
            });

            ResponseWriter.success(
                res,
                { ok: true, deleted_columns, released_issues },
                "Chapter deleted",
            );
        } catch (error) {
            console.error("ChapterDeleteController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
