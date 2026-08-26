import { Action } from "@trymatcha/access-control";
import type { Request, Response } from "express";
import z from "zod";

import GithubPullsService from "../../services/service.github_pulls";
import GithubUserService from "../../services/service.github_user";
import ResponseWriter from "../../services/service.response";
import { load_review } from "./review.guard";

const params_schema = z.object({
    comment_id: z.string().min(1),
});

const body_schema = z.object({
    body: z.string().trim().min(1).max(65_536),
});

export default async function update_review_comment_controller(req: Request, res: Response) {
    try {
        const resolved = await load_review(req, res, Action.project.comment_review);
        if (!resolved) return;

        const params = params_schema.safeParse(req.params);
        const parsed = body_schema.safeParse(req.body);
        if (!params.success || !parsed.success) {
            ResponseWriter.invalid_data(res, "A comment cannot be empty");
            return;
        }

        const token = await GithubUserService.user_token(req.user.id);
        if (!token) {
            ResponseWriter.custom(
                res,
                false,
                "GITHUB_NOT_LINKED",
                "Connect your GitHub account to edit this comment.",
                409,
            );
            return;
        }

        const comment = await GithubPullsService.updateComment(
            token,
            resolved.ref,
            params.data.comment_id,
            parsed.data.body,
        );
        ResponseWriter.success(res, comment, "Comment updated");
    } catch (error) {
        if (error && typeof error === "object" && "status" in error && error.status === 403) {
            ResponseWriter.custom(
                res,
                false,
                "FORBIDDEN_COMMENT_ACTION",
                "You can only edit your own comments.",
                403,
            );
            return;
        }
        console.error("error in update_review_comment_controller:", error);
        ResponseWriter.system_error(res);
    }
}
