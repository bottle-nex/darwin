import { Request, Response } from "express";
import z from "zod";
import GithubPullsService from "../../services/service.github_pulls";
import ResponseWriter from "../../services/service.response";
import { load_review } from "./review.guard";

const query_schema = z.object({ path: z.string().min(1).max(1024) });

export default async function get_review_file_controller(req: Request, res: Response) {
    try {
        const resolved = await load_review(req, res);
        if (!resolved) return;

        const parsed = query_schema.safeParse(req.query);
        if (!parsed.success) {
            ResponseWriter.invalid_data(res, "A file path is required");
            return;
        }

        const { ref } = resolved;
        const { baseSha } = await GithubPullsService.getPullRequest(
            ref.installationId,
            ref.owner,
            ref.repo,
            ref.pullNumber,
        );
        const source = await GithubPullsService.getFileSource(ref, parsed.data.path, baseSha);

        ResponseWriter.success(res, {
            path: parsed.data.path,
            source,
            lines: source ? source.split("\n").length : 0,
        });
    } catch (error) {
        console.error("error in get_review_file_controller:", error);
        ResponseWriter.system_error(res);
    }
}
