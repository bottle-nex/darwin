import { Harness, type Effort } from "@trydarwin/database";
import {
    AgentHarness,
    CredentialSource,
    effort_to_flag,
    type HarnessInvocationInput,
    type McpServerSpec,
} from "./harness";

function toml_string(value: string): string {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

class CodexHarness extends AgentHarness {
    readonly harness = Harness.Codex;
    readonly binary = "codex";
    readonly pinnedVersion = "";
    readonly credentialEnvVar = "OPENAI_API_KEY";
    readonly credentialSource = CredentialSource.PlatformKey;

    override buildEffortFlags(effort: Effort): string[] {
        return ["-c", `model_reasoning_effort=${effort_to_flag(effort)}`];
    }

    buildBypassFlags(): string[] {
        return ["--dangerously-bypass-approvals-and-sandbox"];
    }

    buildInvocation({ promptPath, model, extra }: HarnessInvocationInput): string[] {
        return ["exec", `"$(cat ${promptPath})"`, "-c", `model=${model}`, "--json", ...extra];
    }

    // codex reads /.codex/config.toml instead of json like others
    mcpConfigPath(): string {
        return "/home/user/.codex/config.toml";
    }

    buildMcpConfig(server: McpServerSpec, _existing: string | null): string {
        const args = server.args.map(toml_string).join(", ");
        const env_lines = Object.entries(server.env)
            .map(([key, value]) => `${key} = ${toml_string(value)}`)
            .join("\n");
        return [
            `[mcp_servers.${server.name}]`,
            `command = ${toml_string(server.command)}`,
            `args = [${args}]`,
            "",
            `[mcp_servers.${server.name}.env]`,
            env_lines,
            "",
        ].join("\n");
    }
}

export default CodexHarness;
