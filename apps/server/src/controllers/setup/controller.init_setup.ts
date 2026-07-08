import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";

export default class SetupInitController {
    static body_schema = z.object({
        project_id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data, success } = this.body_schema.safeParse(req.body);
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const role = Access.project(user.id, data.project_id);
        if (!role) return;
        // if (Permissions.project(role, Action.project.update)) {

        // }
    }
}
