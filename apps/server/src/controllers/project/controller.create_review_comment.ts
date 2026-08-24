import { Action } from "@trymatcha/access-control";
import type { Request, Response } from "express";
import z from "zod";

import GithubPullsService from "../../services/service.github_pulls";
import GithubUserService from "../../services/service.github_user";
import ResponseWriter from "../../services/service.response";
import { load_review } from "./review.guard";

const body_schema = z.object({
    body: z.string().trim().min(1).max(65_536),
});

export default async function create_review_comment_controller(req: Request, res: Response) {
    try {
        const resolved = await load_review(req, res, Action.project.comment_review);
        if (!resolved) return;

        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            ResponseWriter.invalid_data(res, "A comment cannot be empty");
            return;
        }

        const token = await GithubUserService.user_token(req.user.id);
        if (!token) {
            ResponseWriter.custom(
                res,
                false,
                "GITHUB_NOT_LINKED",
                "Connect your GitHub account to comment on this pull request.",
                409,
            );
            return;
        }

        const comment = await GithubPullsService.createComment(
            token,
            resolved.ref,
            parsed.data.body,
        );
        ResponseWriter.created(res, comment, "Comment posted");
    } catch (error) {
        console.error("error in create_review_comment_controller:", error);
        ResponseWriter.system_error(res);
    }
}
