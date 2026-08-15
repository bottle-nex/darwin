// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// src/service.graph_search.ts
import { execFile } from "child_process";
import { existsSync } from "fs";
import { promisify } from "util";
var run = promisify(execFile);
var QUERY_TIMEOUT_MS = 6e4;
var MAX_OUTPUT_BYTES = 4 * 1024 * 1024;
var MAX_ANSWER_CHARS = 12e3;
var PATH_FALLBACK = "/usr/local/bin:/usr/bin:/bin";
var FALLBACK_TO_GREP = "Fall back to Grep and Glob for this one.";
var GraphSearch = class _GraphSearch {
  static GRAPH_PATH = process.env.MATCHA_GRAPH_PATH;
  static async query(symbol) {
    const graph = _GraphSearch.GRAPH_PATH;
    if (!graph || !existsSync(graph)) {
      return `No code graph was built for this run. ${FALLBACK_TO_GREP}`;
    }
    try {
      const { stdout } = await run("graphify", ["query", symbol, "--graph", graph], {
        timeout: QUERY_TIMEOUT_MS,
        maxBuffer: MAX_OUTPUT_BYTES,
        env: { ...process.env, PATH: process.env.PATH ?? PATH_FALLBACK }
      });
      const answer = stdout.trim();
      if (!answer) {
        return `The code graph has no node named "${symbol}". Check the spelling against the code, or ${FALLBACK_TO_GREP.toLowerCase()}`;
      }
      return _GraphSearch.clamp(answer);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return `Code graph query failed: ${reason}. ${FALLBACK_TO_GREP}`;
    }
  }
  static clamp(answer) {
    if (answer.length <= MAX_ANSWER_CHARS) return answer;
    return `${answer.slice(0, MAX_ANSWER_CHARS)}

[truncated \u2014 ${answer.length - MAX_ANSWER_CHARS} more characters. Ask a narrower question to see the rest.]`;
  }
};

// src/index.ts
var SetupStatus = /* @__PURE__ */ ((SetupStatus2) => {
  SetupStatus2["PENDING"] = "Pending";
  SetupStatus2["PROVISIONING"] = "Provisioning";
  SetupStatus2["CLONING"] = "Cloning";
  SetupStatus2["DETECTING"] = "Detecting";
  SetupStatus2["INSTALLING_DEPS"] = "InstallingDeps";
  SetupStatus2["BOOTING_SERVICES"] = "BootingServices";
  SetupStatus2["WAITING_ON_USER"] = "WaitingOnUser";
  SetupStatus2["VERIFYING"] = "Verifying";
  SetupStatus2["READY"] = "Ready";
  SetupStatus2["FAILED"] = "Failed";
  return SetupStatus2;
})(SetupStatus || {});
var SetupQuestionType = /* @__PURE__ */ ((SetupQuestionType2) => {
  SetupQuestionType2["NEED_SECRET"] = "NeedSecret";
  SetupQuestionType2["NEED_VALUE"] = "NeedValue";
  SetupQuestionType2["NEED_CHOICE"] = "NeedChoice";
  SetupQuestionType2["CONFIRM"] = "Confirm";
  SetupQuestionType2["NEED_FILE"] = "NeedFile";
  SetupQuestionType2["NEED_ACCESS"] = "NeedAccess";
  SetupQuestionType2["DEFINE_SUCCESS"] = "DefineSuccess";
  SetupQuestionType2["CLARIFY"] = "Clarify";
  SetupQuestionType2["APPROVE_COST"] = "ApproveCost";
  return SetupQuestionType2;
})(SetupQuestionType || {});
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
      { status: z.enum(SetupStatus) },
      this.update_status.bind(this)
    );
    this.mcp_server.tool(
      "ask_user",
      "Ask the user for input you cannot derive (secret, choice, confirm). Blocks until answered.",
      {
        type: z.enum(SetupQuestionType),
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
        const { data } = await res.json();
        return this.text(
          data?.provided ? "provided (set as env var, retry now)" : String(data?.value)
        );
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
var WorkerRuntimeStatus = /* @__PURE__ */ ((WorkerRuntimeStatus2) => {
  WorkerRuntimeStatus2["BUSY"] = "Busy";
  WorkerRuntimeStatus2["IDLE"] = "Idle";
  return WorkerRuntimeStatus2;
})(WorkerRuntimeStatus || {});
var WorkerMcpServerService = class _WorkerMcpServerService {
  mcp_server;
  static SERVER = process.env.MATCHA_SERVER_URL;
  static TOKEN = process.env.MATCHA_SANDBOX_TOKEN;
  // per-worker token
  constructor() {
    this.mcp_server = new McpServer({
      name: "matcha-worker-mcp",
      version: "0.1.0"
    });
    this.register_tools();
  }
  register_tools() {
    this.mcp_server.tool(
      "report_status",
      "Report whether this worker is Busy (actively solving an issue) or Idle (nothing left to work on). Call this before opening a PR once there is no more queued work.",
      { status: z.enum(WorkerRuntimeStatus) },
      this.report_status.bind(this)
    );
    this.mcp_server.tool(
      "report_pr_opened",
      "Report the PR you just opened for the issue you solved: the issue's id (given to you at the start of this task), the PR URL, the branch it was raised from, and a short summary of the change.",
      {
        issue_id: z.string(),
        pr_url: z.string(),
        branch: z.string(),
        summary: z.string()
      },
      this.report_pr_opened.bind(this)
    );
    this.mcp_server.tool(
      "search_code",
      `Search this repository's code graph: where a symbol is defined, which files import it, and what calls what. Prefer this over Grep when you need every file involved in a change \u2014 it reads the repository's structure rather than its text. Pass one identifier exactly as it appears in the code ("Button", "HostControls", "useLiveQuizStore"), not a sentence \u2014 a sentence seeds the traversal with its own noise words and returns a subgraph that answers nothing. Call it again for each further symbol you need.`,
      { symbol: z.string() },
      this.search_code.bind(this)
    );
  }
  async search_code({ symbol }) {
    return this.text(await GraphSearch.query(symbol));
  }
  async report_status({ status }) {
    console.error(`[sandbox-mcp:worker] report_status(${status}) \u2014 about to notify server`);
    try {
      await this.api("/status", {
        method: "POST",
        body: JSON.stringify({ status })
      });
      console.error(`[sandbox-mcp:worker] report_status(${status}) \u2014 server acknowledged`);
      return this.text("ok");
    } catch (err) {
      console.error(`[sandbox-mcp:worker] report_status(${status}) \u2014 failed:`, err);
      return this.text("error reporting status");
    }
  }
  async report_pr_opened(args) {
    console.error(
      `[sandbox-mcp:worker] report_pr_opened(branch=${args.branch}, pr_url=${args.pr_url}) \u2014 about to notify server`
    );
    try {
      await this.api("/pr-opened", {
        method: "POST",
        body: JSON.stringify(args)
      });
      console.error(`[sandbox-mcp:worker] report_pr_opened \u2014 server acknowledged`);
      return this.text("ok");
    } catch (err) {
      console.error(`[sandbox-mcp:worker] report_pr_opened \u2014 failed:`, err);
      return this.text("error reporting PR outcome");
    }
  }
  api(path, init) {
    return fetch(`${_WorkerMcpServerService.SERVER}/api/v1/worker${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${_WorkerMcpServerService.TOKEN}`,
        "content-type": "application/json"
      }
    });
  }
  text(text) {
    return { content: [{ type: "text", text }] };
  }
  async start() {
    await this.mcp_server.connect(new StdioServerTransport());
  }
};
var session_kind = process.env.MATCHA_SESSION_KIND ?? "setup";
console.error(`[sandbox-mcp] starting in "${session_kind}" mode`);
if (session_kind === "worker") {
  await new WorkerMcpServerService().start();
} else {
  await new McpServerService().start();
}
export {
  McpServerService,
  WorkerMcpServerService
};
