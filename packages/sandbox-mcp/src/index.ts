import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
    deliver_run_log,
    REPORT_PROGRESS_DESCRIPTION,
    type ReportProgressArgs,
    report_progress_schema,
    to_run_log_event,
} from "./run-log.tool";

enum SetupStatus {
    PENDING = "Pending",
    PROVISIONING = "Provisioning",
    CLONING = "Cloning",
    DETECTING = "Detecting",
    INSTALLING_DEPS = "InstallingDeps",
    BOOTING_SERVICES = "BootingServices",
    WAITING_ON_USER = "WaitingOnUser",
    VERIFYING = "Verifying",
    READY = "Ready",
    FAILED = "Failed",
}

enum AgentQuestionType {
    NEED_SECRET = "NeedSecret",
    NEED_VALUE = "NeedValue",
    NEED_CHOICE = "NeedChoice",
    CONFIRM = "Confirm",
    NEED_FILE = "NeedFile",
    NEED_ACCESS = "NeedAccess",
    DEFINE_SUCCESS = "DefineSuccess",
    CLARIFY = "Clarify",
    APPROVE_COST = "ApproveCost",
}

/**
 * A pause freezes this process mid-request, and the connection it was holding is gone when the
 * snapshot is restored. Without a deadline that first poll after a resume waits on a dead socket
 * for as long as the OS takes to notice — long enough to burn the MCP client's own request
 * timeout, which is frozen through the pause and so only ever sees unpaused time. Failing fast
 * and polling again is what lets an answer come back in seconds however long the wait was.
 */
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Accepts whatever the model called the kind of question and settles on the closest real one.
 *
 * The schema used to reject anything outside the enum, which cost a whole turn every time a
 * model reached for a reasonable synonym — "NeedClarification" for Clarify. The kind only shapes
 * how the question is rendered, so guessing wrong is worth far less than losing the question.
 */
function normalize_question_type(value: string): AgentQuestionType {
    const match = Object.values(AgentQuestionType).find(
        (kind) => kind.toLowerCase() === value.toLowerCase(),
    );
    if (match) return match;

    const loose = value.toLowerCase().replace(/[^a-z]/g, "");
    if (loose.includes("secret")) return AgentQuestionType.NEED_SECRET;
    if (loose.includes("choice") || loose.includes("choose")) return AgentQuestionType.NEED_CHOICE;
    if (loose.includes("confirm") || loose.includes("approve")) return AgentQuestionType.CONFIRM;
    if (loose.includes("file")) return AgentQuestionType.NEED_FILE;
    if (loose.includes("access")) return AgentQuestionType.NEED_ACCESS;
    if (loose.includes("value")) return AgentQuestionType.NEED_VALUE;

    return AgentQuestionType.CLARIFY;
}

type AskArgs = {
    type: string;
    key: string;
    prompt: string;
    options?: string[];
};

export class McpServerService {
    private mcp_server: McpServer;

    private static readonly SERVER = process.env.DARWIN_SERVER_URL!;
    private static readonly TOKEN = process.env.DARWIN_SANDBOX_TOKEN!; // per-session token
    private static readonly POLL_INTERVAL_MS = 1000;

    constructor() {
        this.mcp_server = new McpServer({
            name: "darwin-setup-mcp",
            version: "0.1.0",
        });
        this.register_tools();
    }

    public register_tools() {
        this.mcp_server.tool(
            "update_status",
            "Report the current setup phase.",
            { status: z.enum(SetupStatus) },
            this.update_status.bind(this),
        );

        this.mcp_server.tool(
            "ask_user",
            "Ask the user for input you cannot derive (secret, choice, confirm). Blocks until answered.",
            {
                type: z
                    .string()
                    .describe(
                        `One of ${Object.values(AgentQuestionType).join(", ")}. Anything close is accepted.`,
                    ),
                key: z.string(),
                prompt: z.string(),
                options: z.array(z.string()).optional(),
            },
            this.ask_user.bind(this),
        );

        this.mcp_server.tool(
            "save_infrastructure",
            "Save the finalized infrastructure.md once the project runs green.",
            { md: z.string() },
            this.save_infrastructure.bind(this),
        );
    }

    private async update_status({ status }: { status: SetupStatus }) {
        try {
            await this.api("/sandbox/status", {
                method: "POST",
                body: JSON.stringify({ status }),
            });
            return this.text("ok");
        } catch (err) {
            console.error("error while updating the status", err);
            return this.text("error updating status");
        }
    }

    private async ask_user(args: AskArgs) {
        await this.api("/sandbox/ask", {
            method: "POST",
            body: JSON.stringify(args),
        });

        // A pause snapshots this process but drops its open connections, so the request in
        // flight when the sandbox was paused fails the moment it resumes. Polling has nothing to
        // lose by retrying, and treating a dropped request as fatal would end the run at exactly
        // the point the answer finally arrived.
        for (;;) {
            let res: Response;
            try {
                res = await this.api(`/sandbox/answer?key=${encodeURIComponent(args.key)}`);
            } catch {
                await this.sleep(McpServerService.POLL_INTERVAL_MS);
                continue;
            }

            if (res.status === 200) {
                const body = (await res.json()) as {
                    error?: { code?: string };
                    data?: { value?: string; provided?: boolean };
                };

                if (body.error?.code === "QUESTION_CANCELLED") {
                    return this.text("nobody answered in time; proceed with your best judgement");
                }

                return this.text(
                    body.data?.provided
                        ? "provided (set as env var, retry now)"
                        : String(body.data?.value),
                );
            }
            await this.sleep(McpServerService.POLL_INTERVAL_MS);
        }
    }

    private async save_infrastructure({ md }: { md: string }) {
        await this.api("/sandbox/infrastructure", {
            method: "POST",
            body: JSON.stringify({ md }),
        });
        return this.text("saved");
    }

    private api(path: string, init?: RequestInit) {
        return fetch(`${McpServerService.SERVER}/api/v1/setup${path}`, {
            ...init,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            headers: {
                authorization: `Bearer ${McpServerService.TOKEN}`,
                "content-type": "application/json",
            },
        });
    }

    private sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private text(text: string) {
        return { content: [{ type: "text" as const, text }] };
    }

    public async start() {
        await this.mcp_server.connect(new StdioServerTransport());
    }
}

enum WorkerRuntimeStatus {
    BUSY = "Busy",
    IDLE = "Idle",
}

export class WorkerMcpServerService {
    private mcp_server: McpServer;

    private static readonly SERVER = process.env.DARWIN_SERVER_URL!;
    private static readonly TOKEN = process.env.DARWIN_SANDBOX_TOKEN!; // per-worker token
    private static readonly POLL_INTERVAL_MS = 1000;

    private run_log_seq = 0;

    constructor() {
        this.mcp_server = new McpServer({
            name: "darwin-worker-mcp",
            version: "0.1.0",
        });
        this.register_tools();
    }

    public register_tools() {
        this.mcp_server.tool(
            "ask_user",
            "Ask the person who filed this issue for input you cannot derive (choice, confirm, clarification). Blocks until answered or until nobody answers in time.",
            {
                type: z
                    .string()
                    .describe(
                        `One of ${Object.values(AgentQuestionType).join(", ")}. Anything close is accepted.`,
                    ),
                key: z.string(),
                prompt: z.string(),
                options: z.array(z.string()).optional(),
            },
            this.ask_user.bind(this),
        );

        this.mcp_server.tool(
            "report_status",
            "Report whether this worker is Busy (actively solving an issue) or Idle (nothing left to work on). Call this before opening a PR once there is no more queued work.",
            { status: z.enum(WorkerRuntimeStatus) },
            this.report_status.bind(this),
        );

        this.mcp_server.tool(
            "report_progress",
            REPORT_PROGRESS_DESCRIPTION,
            report_progress_schema,
            this.report_progress.bind(this),
        );
    }

    private async ask_user(args: AskArgs) {
        let asked: Response;
        try {
            asked = await this.api("/ask", {
                method: "POST",
                body: JSON.stringify({ ...args, type: normalize_question_type(args.type) }),
            });
        } catch {
            return this.text("could not reach the user; proceed with your best judgement");
        }

        if (!asked.ok)
            return this.text("could not reach the user; proceed with your best judgement");

        // See the note on the setup server's poll: a resumed sandbox loses the request that was
        // in flight when it paused, so a dropped connection is a retry, not a failure.
        for (;;) {
            let res: Response;
            try {
                res = await this.api(`/answer?key=${encodeURIComponent(args.key)}`);
            } catch {
                await this.sleep(WorkerMcpServerService.POLL_INTERVAL_MS);
                continue;
            }

            if (res.status === 200) {
                const body = (await res.json()) as {
                    error?: { code?: string };
                    data?: { value?: string; provided?: boolean };
                };

                if (body.error?.code === "QUESTION_CANCELLED") {
                    return this.text("nobody answered in time; proceed with your best judgement");
                }

                return this.text(
                    body.data?.provided
                        ? "provided (set as env var, retry now)"
                        : String(body.data?.value),
                );
            }

            await this.sleep(WorkerMcpServerService.POLL_INTERVAL_MS);
        }
    }

    private sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private async report_progress(args: ReportProgressArgs) {
        const event = to_run_log_event(args);
        if (!event) return this.text("ignored");

        const vm_url = process.env.DARWIN_VM_URL;
        const run_id = process.env.DARWIN_RUN_ID;
        if (!vm_url || !run_id) return this.text("progress reporting is not configured");

        this.run_log_seq += 1;
        const seq = this.run_log_seq;

        const stored = await deliver_run_log(vm_url, WorkerMcpServerService.TOKEN, {
            run_id,
            seq,
            event,
        });
        if (!stored) console.error(`[sandbox-mcp:worker] report_progress ${seq} not stored`);

        return this.text(stored ? "ok" : "not recorded");
    }

    private async report_status({ status }: { status: WorkerRuntimeStatus }) {
        console.error(`[sandbox-mcp:worker] report_status(${status}) — about to notify server`);
        try {
            await this.api("/status", {
                method: "POST",
                body: JSON.stringify({ status }),
            });
            console.error(`[sandbox-mcp:worker] report_status(${status}) — server acknowledged`);
            return this.text("ok");
        } catch (err) {
            console.error(`[sandbox-mcp:worker] report_status(${status}) — failed:`, err);
            return this.text("error reporting status");
        }
    }

    private api(path: string, init?: RequestInit) {
        return fetch(`${WorkerMcpServerService.SERVER}/api/v1/worker${path}`, {
            ...init,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            headers: {
                authorization: `Bearer ${WorkerMcpServerService.TOKEN}`,
                "content-type": "application/json",
            },
        });
    }

    private text(text: string) {
        return { content: [{ type: "text" as const, text }] };
    }

    public async start() {
        await this.mcp_server.connect(new StdioServerTransport());
    }
}

const session_kind = process.env.DARWIN_SESSION_KIND ?? "setup";
console.error(`[sandbox-mcp] starting in "${session_kind}" mode`);

if (session_kind === "worker") {
    await new WorkerMcpServerService().start();
} else {
    await new McpServerService().start();
}
