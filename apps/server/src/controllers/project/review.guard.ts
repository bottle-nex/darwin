import { Action, Permissions, type ProjectAction } from "@trymatcha/access-control";
import { Request, Response } from "express";
import z from "zod";
import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";
import ReviewService, { type ResolvedReview } from "../../services/service.review";

const params_schema = z.object({
    project_id: z.string(),
    pull_number: z.coerce.number().int().positive(),
});

export async function load_review(
    req: Request,
    res: Response,
    action: ProjectAction = Action.project.read,
): Promise<ResolvedReview | null> {
    const parsed = params_schema.safeParse(req.params);
    if (!parsed.success) {
        ResponseWriter.invalid_data(res, "Invalid pull request");
        return null;
    }

    const { project_id, pull_number } = parsed.data;
    const role = await Access.project(req.user.id, project_id);
    if (!role || !Permissions.project(role, action)) {
        ResponseWriter.not_authorized(res);
        return null;
    }

    const resolved = await ReviewService.resolve(project_id, pull_number);
    if (!resolved) {
        ResponseWriter.not_found(res, "Pull request not found");
        return null;
    }
    return resolved;
}
