import type { McpServerSpec } from "@trydarwin/harness";

import { ENV } from "../../conf/config.env";

export const REPO_DIR = "/home/user/repo";
export const SAFE_BRANCH = /^[A-Za-z0-9._/-]+$/;

// Renewed while the run drives this worker; a crashed process lets the lease lapse instead of releasing it.
export const WORKER_LEASE_MS = 5 * 60_000;
export const WORKER_LEASE_RENEW_MS = 60_000;
export const SANDBOX_TIMEOUT_MS = 15 * 60_000;
// E2B hard-caps sandbox lifetime at 1 hour, so a worker loop needing longer gets its sandbox killed mid-run (no keep-alive wired up yet).
export const WORKER_SANDBOX_TIMEOUT_MS = 55 * 60_000;
export const CLONE_TIMEOUT_MS = 10 * 60_000;
export const ISSUE_PROMPT_PATH = "/home/user/issue_prompt.txt";

// Unit/record separators, not newlines, since a commit message itself contains newlines.
export const COMMIT_FORMAT = "%H%x1f%s%x1f%b%x1e";
export const PR_BODY_PATH = "/home/user/pr_body.md";
export const SOLVE_REPORT_PATH = "/home/user/solve_report.md";
export const SOLVE_REPORT_MAX_CHARS = 16_000;
export const SANDBOX_MCP_ENTRY = "/opt/matcha/sandbox-mcp/index.js";
export const ISSUE_SOLVE_TIMEOUT_MS = 30 * 60_000;
export const ISSUE_PUSH_TIMEOUT_MS = 10 * 60_000;
export const MAX_PUSH_ATTEMPTS = 3;

export const BASE_MCP_SERVER: McpServerSpec = {
    name: "matcha",
    command: "node",
    args: [SANDBOX_MCP_ENTRY],
    env: {
        MATCHA_SERVER_URL: ENV.PUBLIC_API_URL,
        MATCHA_SESSION_KIND: "worker",
    },
};

export function validate_branch(branch: string): void {
    if (!SAFE_BRANCH.test(branch)) {
        throw new Error(`refusing to use unsafe branch name: ${branch}`);
    }
}
