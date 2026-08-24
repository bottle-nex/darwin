import { Action, Permissions } from "@trymatcha/access-control";
import type { Request, Response } from "express";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";
import SecretService from "../../services/service.secret";

export default async function delete_secret_controller(req: Request, res: Response) {
    try {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const project_id = req.params.project_id as string;
        const key = req.params.key as string;
        if (!project_id || !key) {
            ResponseWriter.invalid_data(res, "Missing project id or secret key");
            return;
        }

        const role = await Access.project(user.id, project_id);
        if (!role || !Permissions.project(role, Action.project.manage_connectors)) {
            ResponseWriter.not_authorized(
                res,
                "You don't have permission to manage this project's secrets",
            );
            return;
        }

        await SecretService.delete_secret(project_id, key);
        ResponseWriter.success(res, { key }, "Secret deleted");
    } catch (err) {
        console.error("delete_secret_controller failed: ", err);
        ResponseWriter.system_error(res);
    }
}
