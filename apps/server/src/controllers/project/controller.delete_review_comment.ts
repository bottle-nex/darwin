import { Action } from "@trydarwin/access-control";
import type { Request, Response } from "express";
import z from "zod";

import GithubPullsService, {
    ReviewDeleteUnsupportedError,
} from "../../services/service.github_pulls";
import GithubUserService from "../../services/service.github_user";
import ResponseWriter from "../../services/service.response";
import { load_review } from "./review.guard";

const params_schema = z.object({
    comment_id: z.string().min(1),
});

export default async function delete_review_comment_controller(req: Request, res: Response) {
    try {
        const resolved = await load_review(req, res, Action.project.comment_review);
        if (!resolved) return;

        const params = params_schema.safeParse(req.params);
        if (!params.success) {
            ResponseWriter.invalid_data(res, "Invalid comment");
            return;
        }

        const token = await GithubUserService.user_token(req.user.id);
        if (!token) {
            ResponseWriter.custom(
                res,
                false,
                "GITHUB_NOT_LINKED",
                "Connect your GitHub account to delete this comment.",
                409,
            );
            return;
        }

        await GithubPullsService.deleteComment(token, resolved.ref, params.data.comment_id);
        ResponseWriter.success(res, null, "Comment deleted");
    } catch (error) {
        if (error instanceof ReviewDeleteUnsupportedError) {
            ResponseWriter.invalid_data(res, error.message);
            return;
        }
        if (error && typeof error === "object" && "status" in error && error.status === 403) {
            ResponseWriter.custom(
                res,
                false,
                "FORBIDDEN_COMMENT_ACTION",
                "You can only delete your own comments.",
                403,
            );
            return;
        }
        console.error("error in delete_review_comment_controller:", error);
        ResponseWriter.system_error(res);
    }
}
