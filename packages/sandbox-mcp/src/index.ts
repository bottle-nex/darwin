import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

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

await new McpServerService().start();
