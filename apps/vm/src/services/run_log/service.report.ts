import type { Effort, Harness } from "@trymatcha/database";
import type Logger from "@trymatcha/logger";

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
        log: Logger,
    ) {
        await RunReporter.post(
            "/run-completed",
            token,
            {
                run_id,
                issue_id,
                summary: report.result?.slice(0, 500),
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

    private static async post(path: string, token: string, body: unknown, log: Logger) {
        try {
            const response = await fetch(`${ENV.SERVER_PUBLIC_API_URL}/api/v1/worker${path}`, {
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
