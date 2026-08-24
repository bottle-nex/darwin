import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";
import SecretService from "../../services/service.secret";

const body_schema = z.object({
    secrets: z.array(
        z.object({
            key: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Invalid env var name"),
            value: z.string().min(1),
        }),
    ),
});

export default async function set_secrets_controller(req: Request, res: Response) {
    try {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data, success } = body_schema.safeParse(req.body);
        if (!success) {
            ResponseWriter.invalid_data(res, "Invalid data provider");
            return;
        }

        const project_id = req.params.project_id as string;
        if (!project_id) {
            ResponseWriter.not_found(res, "Project Id nout found");
            return;
        }

        const project = await prisma.project.findUnique({
            where: { id: project_id },
            select: { id: true },
        });
        if (!project) {
            ResponseWriter.not_found(res, "Project not found");
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

        const { secrets } = data;
        for (const { key, value } of secrets) {
            await SecretService.set_secret(project_id, key, value);
        }

        ResponseWriter.success(res, { count: secrets.length }, "Secrets saved ");
    } catch (err) {
        console.error("set_secrets_controller failed: ", err);
        ResponseWriter.system_error(res);
    }
}
