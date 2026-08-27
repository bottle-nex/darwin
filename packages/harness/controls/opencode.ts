import { Harness } from "@trymatcha/database";
import {
    AgentHarness,
    CredentialSource,
    type HarnessInvocationInput,
    type McpServerSpec,
} from "./harness";

function parse_json_object(text: string | null): Record<string, unknown> {
    if (!text) return {};
    try {
        const parsed: unknown = JSON.parse(text);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : {};
    } catch {
        return {};
    }
}

class OpenCodeHarness extends AgentHarness {
    readonly harness = Harness.OpenCode;
    readonly binary = "opencode";
    readonly pinnedVersion = "";
    readonly models = [
        "google/gemini-3-pro",
        "minimax/minimax-m2.1",
        "xai/grok-4.6",
        "xai/grok-4.5",
        "deepseek/deepseek-v4-flash",
        "xiaomi/mimo-v2.5",
    ];
    readonly credentialEnvVar = "OPENCODE_PROVIDER_KEY";
    readonly credentialSource = CredentialSource.ProjectSecret;
    readonly supportsEffort = false;

    buildBypassFlags(): string[] {
        return ["--yolo"];
    }

    buildInvocation({ promptPath, model, extra }: HarnessInvocationInput): string[] {
        return ["run", `"$(cat ${promptPath})"`, "--model", model, "--print-logs", ...extra];
    }

    // .opencode/opencode.json, not a bare repo-root opencode.json — confirmed by graphify's
    // own `opencode install` output, which writes its plugin registration to this exact path.
    // That means this file is shared with graphify, not ours alone — buildMcpConfig below has
    // to merge into it, never overwrite it outright.
    mcpConfigPath(): string {
        return "/home/user/repo/.opencode/opencode.json";
    }

    buildMcpConfig(server: McpServerSpec, existing: string | null): string {
        const parsed = parse_json_object(existing);
        const mcp = parse_json_object(parsed.mcp !== undefined ? JSON.stringify(parsed.mcp) : null);

        return JSON.stringify(
            {
                ...parsed,
                mcp: {
                    ...mcp,
                    [server.name]: {
                        type: "local",
                        command: [server.command, ...server.args],
                        environment: server.env,
                    },
                },
            },
            null,
            2,
        );
    }
}

export default OpenCodeHarness;
