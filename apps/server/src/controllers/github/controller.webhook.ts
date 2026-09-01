import type { Request, Response } from "express";

import { server_services } from "../..";
import GithubWebhookService from "../../services/service.github_webhook";
import IssueOutcomeService from "../../services/service.issue_outcome";
import ResponseWriter from "../../services/service.response";

export default class GithubWebhookController {
    static async process(req: Request, res: Response) {
        try {
            const raw = req.body;
            if (!Buffer.isBuffer(raw)) {
                ResponseWriter.invalid_data(res, "Expected a raw webhook body");
                return;
            }

            const signature = req.headers["x-hub-signature-256"];
            if (!GithubWebhookService.verify_signature(raw, signature as string | undefined)) {
                ResponseWriter.not_authorized(res, "Invalid webhook signature");
                return;
            }

            const event = req.headers["x-github-event"];
            if (event === "ping") {
                ResponseWriter.success(res, { ok: true }, "pong");
                return;
            }
            if (event === "issues") {
                await GithubWebhookController.issue_opened(res, JSON.parse(raw.toString()));
                return;
            }
            if (event === "pull_request") {
                await GithubWebhookController.pull_request_merged(res, JSON.parse(raw.toString()));
                return;
            }

            ResponseWriter.success(res, { ignored: true }, "Event ignored");
        } catch (error) {
            console.error("GithubWebhookController error: ", error);
            ResponseWriter.system_error(res);
        }
    }

    private static async issue_opened(res: Response, body: unknown) {
        const importable = GithubWebhookService.issue_to_import(body);
        if (!importable) {
            ResponseWriter.success(res, { ignored: true }, "Event ignored");
            return;
        }

        await server_services.queue.enqueue_github_issue(importable.repo_id, importable.payload);
        ResponseWriter.success(res, { queued: true }, "Issue queued for import");
    }

    private static async pull_request_merged(res: Response, body: unknown) {
        const merged = GithubWebhookService.merged_pull_request(body);
        if (!merged) {
            ResponseWriter.success(res, { ignored: true }, "Event ignored");
            return;
        }

        const issue = await IssueOutcomeService.issue_for_merged_pr(merged.repo_id, merged.pr_url);
        if (!issue) {
            ResponseWriter.success(res, { ignored: true }, "No issue tracks this pull request");
            return;
        }

        await server_services.queue.enqueue_pr_merged({
            kind: "pr_merged",
            issueId: issue.id,
            prUrl: merged.pr_url,
            prNumber: merged.pr_number,
            prTitle: merged.pr_title,
            mergedAt: merged.merged_at,
            mergedByLogin: merged.merged_by_login,
        });
        ResponseWriter.success(res, { queued: true }, "Merge queued");
    }
}
