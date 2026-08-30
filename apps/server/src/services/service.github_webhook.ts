import type { GithubIssuePayload } from "@trymatcha/types";
import crypto from "crypto";

import { ENV } from "../configs/env";

const SIGNATURE_PREFIX = "sha256=";

export default class GithubWebhookService {
    static verify_signature(raw: Buffer, header: string | undefined): boolean {
        if (!header || !header.startsWith(SIGNATURE_PREFIX)) return false;

        const expected = Buffer.from(
            SIGNATURE_PREFIX +
                crypto
                    .createHmac("sha256", ENV.SERVER_GITHUB_APP_WEBHOOK_SECRET)
                    .update(raw)
                    .digest("hex"),
        );
        const received = Buffer.from(header);

        if (expected.length !== received.length) return false;
        return crypto.timingSafeEqual(expected, received);
    }

    static issue_to_import(body: unknown): {
        repo_id: string;
        payload: GithubIssuePayload;
    } | null {
        if (typeof body !== "object" || body === null) return null;
        const event = body as Record<string, unknown>;

        if (event.action !== "opened") return null;

        const repository = event.repository as { id?: number | string } | undefined;
        const issue = event.issue as Record<string, unknown> | undefined;
        if (!repository?.id || !issue) return null;

        if (issue.pull_request) return null;

        const user = issue.user as { login?: string; avatar_url?: string } | undefined;
        if (
            typeof issue.id !== "number" ||
            typeof issue.number !== "number" ||
            typeof issue.title !== "string" ||
            typeof issue.html_url !== "string" ||
            !user?.login
        ) {
            return null;
        }

        return {
            repo_id: String(repository.id),
            payload: {
                githubIssueId: String(issue.id),
                number: issue.number,
                title: issue.title,
                body: typeof issue.body === "string" ? issue.body : "",
                url: issue.html_url,
                authorLogin: user.login,
                authorAvatar: user.avatar_url ?? null,
            },
        };
    }
}
