import { Action, Permissions } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import type { Response } from "express";

import ResponseWriter from "../services/service.response";
import Access from "./access";

export async function readable_issue_project(
    res: Response,
    user_id: string,
    issue_id: string,
): Promise<string | null> {
    const issue = await prisma.issue.findUnique({
        where: { id: issue_id },
        select: { projectId: true },
    });
    if (!issue) {
        ResponseWriter.not_found(res, "Issue not found");
        return null;
    }

    const role = await Access.project(user_id, issue.projectId);
    if (!role || !Permissions.project(role, Action.project.read)) {
        ResponseWriter.not_authorized(res, "You dont have access to the project");
        return null;
    }

    return issue.projectId;
}
