import type { Request, Response } from "express";

import GithubPullsService from "../../services/service.github_pulls";
import ResponseWriter from "../../services/service.response";
import { load_review } from "./review.guard";

export default async function list_review_commits_controller(req: Request, res: Response) {
    try {
        const resolved = await load_review(req, res);
        if (!resolved) return;

        ResponseWriter.success(res, await GithubPullsService.listPullRequestCommits(resolved.ref));
    } catch (error) {
        console.error("error in list_review_commits_controller:", error);
        ResponseWriter.system_error(res);
    }
}
