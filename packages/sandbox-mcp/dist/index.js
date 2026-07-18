// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
var SETUP_STATUS = [
  "Cloning",
  "InstallingDeps",
  "BootingServices",
  "Verifying",
  "Ready",
  "Failed"
];
var QUESTION_TYPE = [
  "NeedSecret",
  "NeedValue",
  "NeedChoice",
  "Confirm",
  "NeedFile",
  "NeedAccess",
  "DefineSuccess",
  "Clarify",
  "ApproveCost"
];
var McpServerService = class _McpServerService {
  mcp_server;
  static SERVER = process.env.MATCHA_SERVER_URL;
  static TOKEN = process.env.MATCHA_SANDBOX_TOKEN;
  // per-session token
  static POLL_INTERVAL_MS = 1e3;
  constructor() {
    this.mcp_server = new McpServer({
      name: "matcha-setup-mcp",
      version: "0.1.0"
    });
    this.register_tools();
  }
  register_tools() {
    this.mcp_server.tool(
      "update_status",
      "Report the current setup phase.",
      { status: z.enum(SETUP_STATUS) },
      this.update_status.bind(this)
    );
    this.mcp_server.tool(
      "ask_user",
      "Ask the user for input you cannot derive (secret, choice, confirm). Blocks until answered.",
      {
        type: z.enum(QUESTION_TYPE),
        key: z.string(),
        prompt: z.string(),
        options: z.array(z.string()).optional()
      },
      this.ask_user.bind(this)
    );
    this.mcp_server.tool(
      "save_infrastructure",
      "Save the finalized infrastructure.md once the project runs green.",
      { md: z.string() },
      this.save_infrastructure.bind(this)
    );
  }
  async update_status({ status }) {
    try {
      await this.api("/sandbox/status", {
        method: "POST",
        body: JSON.stringify({ status })
      });
      return this.text("ok");
    } catch (err) {
      console.error("error while updating the status", err);
      return this.text("error updating status");
    }
  }
  async ask_user(args) {
    await this.api("/sandbox/ask", {
      method: "POST",
      body: JSON.stringify(args)
    });
    for (; ; ) {
      const res = await this.api(`/sandbox/answer?key=${encodeURIComponent(args.key)}`);
      if (res.status === 200) {
        const { value, provided } = await res.json();
        return this.text(provided ? "provided (set as env var, retry now)" : String(value));
      }
      await this.sleep(_McpServerService.POLL_INTERVAL_MS);
    }
  }
  async save_infrastructure({ md }) {
    await this.api("/sandbox/infrastructure", {
      method: "POST",
      body: JSON.stringify({ md })
    });
    return this.text("saved");
  }
  api(path, init) {
    return fetch(`${_McpServerService.SERVER}/api/v1/setup${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${_McpServerService.TOKEN}`,
        "content-type": "application/json"
      }
    });
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  text(text) {
    return { content: [{ type: "text", text }] };
  }
  async start() {
    await this.mcp_server.connect(new StdioServerTransport());
  }
};
await new McpServerService().start();
export {
  McpServerService
};
