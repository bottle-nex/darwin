import { Harness, Effort } from "@trymatcha/database";
import { HARNESS_MODELS, HARNESS_SUPPORTS_EFFORT } from "@trymatcha/types";

enum CredentialSource {
    PlatformKey,
    ProjectSecret,
}

interface HarnessInvocationInput {
    promptPath: string;
    model: string;
    extra: string[];
}

interface McpServerSpec {
    name: string;
    command: string;
    args: string[];
    env: Record<string, string>;
}

function effort_to_flag(effort: Effort): string {
    switch (effort) {
        case Effort.Low:
            return "low";
        case Effort.Medium:
            return "medium";
        case Effort.High:
            return "high";
        case Effort.XHigh:
            return "xhigh";
        case Effort.Max:
            return "max";
    }
}

abstract class AgentHarness {
    abstract readonly harness: Harness;

    // baked into the sandbox template at build time — never installed at boot.
    // pinnedVersion is what the Dockerfile pins; the adapter verifies it against
    // `binary --version` at spawn and stamps whichever one actually ran onto AgentSession.
    abstract readonly binary: string;
    abstract readonly pinnedVersion: string;

    abstract readonly credentialEnvVar: string;
    abstract readonly credentialSource: CredentialSource;

    get models(): string[] {
        return HARNESS_MODELS[this.harness];
    }

    get supportsEffort(): boolean {
        return HARNESS_SUPPORTS_EFFORT[this.harness];
    }

    abstract buildBypassFlags(): string[];
    abstract buildInvocation(input: HarnessInvocationInput): string[];

    // this describes where will the harness MCP will be found in the sandbox
    // there is one caveat here, this is not confirmed for codex/opencode as invocation/effort will be different.
    abstract mcpConfigPath(): string;

    // `existing` is whatever's already at mcpConfigPath() in the sandbox, or null if nothing's
    // there yet. Claude and Codex own their config file outright and can ignore it — nothing
    // else writes there. OpenCode's config path collides with graphify's own install output
    // (both land in .opencode/opencode.json), so its implementation actually has to merge
    // rather than clobber whatever graphify already wrote.
    abstract buildMcpConfig(server: McpServerSpec, existing: string | null): string;

    mcpConfigFlags(_path: string): string[] {
        return [];
    }

    buildEffortFlags(_effort: Effort): string[] {
        return [];
    }

    supportsModel(model: string): boolean {
        return this.models.includes(model);
    }

    buildArgv(input: HarnessInvocationInput & { effort?: Effort | null }): string[] {
        return [
            this.binary,
            ...this.buildInvocation(input),
            ...(this.supportsEffort && input.effort ? this.buildEffortFlags(input.effort) : []),
            ...this.buildBypassFlags(),
        ];
    }
}

export { CredentialSource, AgentHarness, effort_to_flag };
export type { HarnessInvocationInput, McpServerSpec };
