import { Action, Permissions } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";

import Access from "../../access-control/access";
import type { DarwinContext } from "../../services/darwin/tools/tool.registry";
import ResponseWriter from "../../services/service.response";

export type ContextResult =
    | { ok: true; ctx: DarwinContext }
    | { ok: false; reason: "unauthenticated" | "forbidden" | "not_found" };

/**
 * Build the tool context for one request.
 *
 * Resolved once per request and handed to every tool, so a loop that calls three tools across six
 * iterations does not re-run the same membership join eighteen times. This is also the only place
 * `projectId` and `role` enter the agent — nothing downstream can widen either.
 *
 * @example
 * const resolved = await resolve_darwin_context(req, project_id);
 * if (!resolved.ok) return reject_darwin_context(res, resolved);
 */
export async function resolve_darwin_context(
    req: Request,
    project_id: string,
): Promise<ContextResult> {
    const user = req.user;
    if (!user?.id) return { ok: false, reason: "unauthenticated" };

    const role = await Access.project(user.id, project_id);
    if (!role || !Permissions.project(role, Action.project.read)) {
        return { ok: false, reason: "forbidden" };
    }

    // The name is carried so the model can say which board it is looking at. Without it Darwin
    // answers about "the project" and cannot tell one from another.
    const project = await prisma.project.findUnique({
        where: { id: project_id },
        select: { name: true },
    });
    if (!project) return { ok: false, reason: "not_found" };

    return {
        ok: true,
        ctx: {
            userId: user.id,
            userName: user.name ?? user.email,
            projectId: project_id,
            projectName: project.name,
            role,
        },
    };
}

/**
 * Write the response for a context that could not be resolved.
 *
 * Every Darwin endpoint fails these three ways and used to spell the branch out itself, which is
 * how a missing project ended up answering 401 instead of 404 in four places at once.
 *
 * @example
 * if (!resolved.ok) return reject_darwin_context(res, resolved);
 */
export function reject_darwin_context(res: Response, result: ContextResult & { ok: false }) {
    if (result.reason === "not_found") {
        ResponseWriter.not_found(res, "Project not found");
        return;
    }
    ResponseWriter.not_authorized(
        res,
        result.reason === "forbidden" ? "You dont have access to this project" : undefined,
    );
}
