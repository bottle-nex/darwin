import { Action, Permissions } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";

import Access from "../../access-control/access";
import PresenceService from "../../services/service.presence";
import ResponseWriter from "../../services/service.response";

export default async function list_presence_controller(req: Request, res: Response) {
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
        if (!role || !Permissions.project(role, Action.project.read)) {
            ResponseWriter.not_authorized(res, "You don't have access to this project");
            return;
        }

        const members = await prisma.projectMember.findMany({
            where: { projectId: project_id },
            select: { userId: true },
        });

        const online = await PresenceService.online_among(members.map((m) => m.userId));

        ResponseWriter.success(res, { online });
    } catch (err) {
        console.error("list_presence_controller failed: ", err);
        ResponseWriter.system_error(res);
    }
}
