import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import SecretService from "../../services/service.secret";

export default async function list_secrets_controller(req: Request, res: Response) {
    try {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const project_id = req.params.project_id as string;
        if (!project_id) {
            ResponseWriter.not_found(res, "Project not found");
            return;
        }

        const role = await Access.project(user.id, project_id);
        if (!role || !Permissions.project(role, Action.project.manage_connectors)) {
            ResponseWriter.not_authorized(
                res,
                "You don't have permission to view this project's secrets",
            );
            return;
        }

        const secrets = await SecretService.list_secret_keys(project_id);
        ResponseWriter.success(res, { secrets });
    } catch (err) {
        console.error("list_secrets_controller failed: ", err);
        ResponseWriter.system_error(res);
    }
}
