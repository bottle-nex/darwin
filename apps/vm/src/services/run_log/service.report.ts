import type { Effort, Harness } from "@trydarwin/database";
import type Logger from "@trydarwin/logger";

import { ENV } from "../../conf/config.env";
import type { AgentReport } from "../harness/parsers/parser.index";

export interface RunStartedParams {
    run_id: string;
    issue_id: string;
    harness: Harness;
    model: string;
    effort: Effort | null;
    harness_version?: string;
}

export default class RunReporter {
    static async started(token: string, params: RunStartedParams, log: Logger) {
        await RunReporter.post("/run-started", token, params, log);
    }

    static async completed(
        token: string,
        run_id: string,
        issue_id: string,
        report: AgentReport,
        files_changed: number | undefined,
        solve_report: string | undefined,
        log: Logger,
    ) {
        await RunReporter.post(
            "/run-completed",
            token,
            {
                run_id,
                issue_id,
                summary: report.result?.slice(0, 500),
                report: solve_report,
                stats: {
                    num_turns: report.num_turns,
                    duration_ms: report.duration_ms,
                    files_changed,
                },
                cost: { total_cost_usd: report.total_cost_usd },
            },
            log,
        );
    }

    static async failed(
        token: string,
        run_id: string,
        issue_id: string,
        reason: string,
        log: Logger,
    ) {
        await RunReporter.post(
            "/run-failed",
            token,
            { run_id, issue_id, reason: reason.slice(0, 2000) },
            log,
        );
    }

    /**
     * Tells the people on an issue that its branch is now on the remote. Best-effort like the
     * rest of this class: a chat platform that is down must not fail a run whose work is
     * already pushed.
     */
    static async notify(token: string, issue_id: string, text: string, log: Logger) {
        await this.post("/notify", token, { issue_id, text }, log);
    }

    /**
     * Hands the pull request decision to a person and returns. The worker does not wait: the
     * issue is parked as AwaitingApproval and the pull request is opened by the server once the
     * answer arrives, so a sandbox is not held for however long that takes.
     */
    static async request_pr_approval(
        token: string,
        issue_id: string,
        session_id: string,
        pr_body: string,
        log: Logger,
    ) {
        await this.post("/pr-approval", token, { issue_id, session_id, pr_body }, log);
    }

    private static async post(path: string, token: string, body: unknown, log: Logger) {
        try {
            const response = await fetch(`${ENV.PUBLIC_API_URL}/api/v1/worker${path}`, {
                method: "POST",
                headers: {
                    authorization: `Bearer ${token}`,
                    "content-type": "application/json",
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                log.warn(`run report ${path} rejected`, { status: response.status });
            }
        } catch (error) {
            log.error(`run report ${path} failed`, error);
        }
    }
}
