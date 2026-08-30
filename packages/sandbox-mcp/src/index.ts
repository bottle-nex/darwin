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

enum SetupQuestionType {
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

type AskArgs = {
    type: SetupQuestionType;
    key: string;
    prompt: string;
    options?: string[];
};

export class McpServerService {
    private mcp_server: McpServer;

    private static readonly SERVER = process.env.MATCHA_SERVER_URL!;
    private static readonly TOKEN = process.env.MATCHA_SANDBOX_TOKEN!; // per-session token
    private static readonly POLL_INTERVAL_MS = 1000;

    constructor() {
        this.mcp_server = new McpServer({
            name: "matcha-setup-mcp",
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
                type: z.enum(SetupQuestionType),
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

        for (;;) {
            const res = await this.api(`/sandbox/answer?key=${encodeURIComponent(args.key)}`);
            if (res.status === 200) {
                const { data } = (await res.json()) as {
                    data?: { value?: string; provided?: boolean };
                };
                return this.text(
                    data?.provided ? "provided (set as env var, retry now)" : String(data?.value),
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

    private static readonly SERVER = process.env.MATCHA_SERVER_URL!;
    private static readonly TOKEN = process.env.MATCHA_SANDBOX_TOKEN!; // per-worker token

    private run_log_seq = 0;

    constructor() {
        this.mcp_server = new McpServer({
            name: "matcha-worker-mcp",
            version: "0.1.0",
        });
        this.register_tools();
    }

    public register_tools() {
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

    /**
     * Reports one action to the vm worker, which is the only process that writes the run's log.
     *
     * The sequence number is assigned here rather than on the receiving side because this is
     * where a retry originates: the worker acknowledges a sequence only once the cache holds it,
     * so an unacknowledged event can be sent again under the same number and land exactly once.
     *
     * Gives up rather than failing the run. Logging is not the work, and an agent that cannot
     * report should still solve its issue.
     */
    private async report_progress(args: ReportProgressArgs) {
        const event = to_run_log_event(args);
        if (!event) return this.text("ignored");

        const vm_url = process.env.MATCHA_VM_URL;
        const run_id = process.env.MATCHA_RUN_ID;
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

const session_kind = process.env.MATCHA_SESSION_KIND ?? "setup";
console.error(`[sandbox-mcp] starting in "${session_kind}" mode`);

if (session_kind === "worker") {
    await new WorkerMcpServerService().start();
} else {
    await new McpServerService().start();
}
