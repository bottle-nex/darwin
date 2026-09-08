import { Action } from "@trydarwin/access-control";
import { ReviewState } from "@trydarwin/types";
import type { Request, Response } from "express";

import GithubPullsService from "../../services/service.github_pulls";
import GithubUserService from "../../services/service.github_user";
import ResponseWriter from "../../services/service.response";
import ReviewService from "../../services/service.review";
import { github_error_message } from "./review.errors";
import { load_review } from "./review.guard";

export default async function close_review_controller(req: Request, res: Response) {
    try {
        const resolved = await load_review(req, res, Action.project.close_review);
        if (!resolved) return;

        const current = await ReviewService.header(resolved);
        if (current.state !== ReviewState.Open) {
            ResponseWriter.custom(
                res,
                false,
                "REVIEW_NOT_OPEN",
                `This pull request is already ${current.state}.`,
                409,
            );
            return;
        }

        const token = await GithubUserService.user_token(req.user.id);
        if (!token) {
            ResponseWriter.custom(
                res,
                false,
                "GITHUB_NOT_LINKED",
                "Connect your GitHub account to close this pull request.",
                409,
            );
            return;
        }

        try {
            await GithubPullsService.closePullRequest(token, resolved.ref);
        } catch (error) {
            ResponseWriter.custom(
                res,
                false,
                "CLOSE_FAILED",
                github_error_message(error, "Could not close this pull request."),
                422,
            );
            return;
        }

        const header = await ReviewService.recordPullRequestOutcome(resolved, req.user);
        ResponseWriter.success(res, header, "Pull request closed");
    } catch (error) {
        console.error("error in close_review_controller:", error);
        ResponseWriter.system_error(res);
    }
}
