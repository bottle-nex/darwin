import type { Request, Response } from "express";

import { server_services } from "../..";
import GithubWebhookService from "../../services/service.github_webhook";
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
            if (event !== "issues") {
                ResponseWriter.success(res, { ignored: true }, "Event ignored");
                return;
            }

            const importable = GithubWebhookService.issue_to_import(JSON.parse(raw.toString()));
            if (!importable) {
                ResponseWriter.success(res, { ignored: true }, "Event ignored");
                return;
            }

            await server_services.queue.enqueue_github_issue(
                importable.repo_id,
                importable.payload,
            );
            ResponseWriter.success(res, { queued: true }, "Issue queued for import");
        } catch (error) {
            console.error("GithubWebhookController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
