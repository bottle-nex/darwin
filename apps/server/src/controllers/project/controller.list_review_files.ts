import type { Request, Response } from "express";
import z from "zod";

import GithubPullsService from "../../services/service.github_pulls";
import ResponseWriter from "../../services/service.response";
import { load_review } from "./review.guard";

const query_schema = z.object({
    sha: z
        .string()
        .regex(/^[0-9a-f]{7,40}$/)
        .optional(),
});

export default async function list_review_files_controller(req: Request, res: Response) {
    try {
        const { data: query, success } = query_schema.safeParse(req.query);
        if (!success) {
            ResponseWriter.invalid_data(res, "Invalid commit");
            return;
        }

        const resolved = await load_review(req, res);
        if (!resolved) return;

        ResponseWriter.success(
            res,
            query.sha
                ? await GithubPullsService.listCommitFiles(resolved.ref, query.sha)
                : await GithubPullsService.listPullRequestFiles(resolved.ref),
        );
    } catch (error) {
        console.error("error in list_review_files_controller:", error);
        ResponseWriter.system_error(res);
    }
}
