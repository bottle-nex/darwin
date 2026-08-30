import { Harness, type Effort } from "@trymatcha/database";
import {
    AgentHarness,
    CredentialSource,
    effort_to_flag,
    type HarnessInvocationInput,
    type McpServerSpec,
} from "./harness";

class ClaudeHarness extends AgentHarness {
    readonly harness = Harness.Claude;
    readonly binary = "claude";
    readonly pinnedVersion = "";
    readonly models = ["claude-fable-5", "claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"];
    readonly credentialEnvVar = "CLAUDE_CODE_OAUTH_TOKEN";
    readonly credentialSource = CredentialSource.PlatformKey;
    readonly supportsEffort = true;

    override buildEffortFlags(effort: Effort): string[] {
        return ["--effort", effort_to_flag(effort)];
    }

    buildBypassFlags(): string[] {
        return ["--permission-mode", "bypassPermissions"];
    }

    buildInvocation({ promptPath, model, extra }: HarnessInvocationInput): string[] {
        return [
            "-p",
            `"$(cat ${promptPath})"`,
            "--model",
            model,
            "--output-format",
            "stream-json",
            "--verbose",
            ...extra,
        ];
    }

    mcpConfigPath(): string {
        return "/home/user/matcha_mcp_config.json";
    }

    buildMcpConfig(server: McpServerSpec, _existing: string | null): string {
        return JSON.stringify(
            {
                mcpServers: {
                    [server.name]: { command: server.command, args: server.args, env: server.env },
                },
            },
            null,
            2,
        );
    }

    override mcpConfigFlags(path: string): string[] {
        return ["--mcp-config", path];
    }
}

export default ClaudeHarness;
