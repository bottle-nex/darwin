import { Harness, Effort } from "@trymatcha/database";

enum CredentialSource {
    PlatformKey,
    ProjectSecret,
}

interface HarnessInvocationInput {
    promptPath: string;
    model: string;
    extra: string[];
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

    // validated strings, not an enum — models change far more often than harnesses do,
    // and an enum would force a code deploy for every provider release.
    abstract readonly models: string[];

    abstract readonly credentialEnvVar: string;
    abstract readonly credentialSource: CredentialSource;

    abstract readonly supportsEffort: boolean;

    abstract buildBypassFlags(): string[];
    abstract buildInvocation(input: HarnessInvocationInput): string[];

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

class ClaudeHarness extends AgentHarness {
    readonly harness = Harness.Claude;
    readonly binary = "claude";
    readonly pinnedVersion = "";
    readonly models = ["claude-fable-5", "claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"];
    readonly credentialEnvVar = "ANTHROPIC_API_KEY";
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
}

class CodexHarness extends AgentHarness {
    readonly harness = Harness.Codex;
    readonly binary = "codex";
    readonly pinnedVersion = "";
    readonly models = [
        "gpt-5.6-luna",
        "gpt-5.6-terra",
        "gpt-5.6-sol",
        "gpt-5.6-sol-pro",
        "gpt-5.6-sol-ultra",
    ];
    readonly credentialEnvVar = "OPENAI_API_KEY";
    readonly credentialSource = CredentialSource.PlatformKey;
    readonly supportsEffort = true;

    override buildEffortFlags(effort: Effort): string[] {
        return ["-c", `model_reasoning_effort=${effort_to_flag(effort)}`];
    }

    buildBypassFlags(): string[] {
        return ["--dangerously-bypass-approvals-and-sandbox"];
    }

    buildInvocation({ promptPath, model, extra }: HarnessInvocationInput): string[] {
        return ["exec", `"$(cat ${promptPath})"`, "-c", `model=${model}`, "--json", ...extra];
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
}

const CLAUDE_HARNESS = new ClaudeHarness();
const CODEX_HARNESS = new CodexHarness();
const OPENCODE_HARNESS = new OpenCodeHarness();

const HARNESS_REGISTRY: readonly AgentHarness[] = [CLAUDE_HARNESS, CODEX_HARNESS, OPENCODE_HARNESS];

function get_harness(harness: Harness): AgentHarness {
    switch (harness) {
        case Harness.Claude:
            return CLAUDE_HARNESS;
        case Harness.Codex:
            return CODEX_HARNESS;
        case Harness.OpenCode:
            return OPENCODE_HARNESS;
    }
}

function is_model_supported(harness: Harness, model: string): boolean {
    return get_harness(harness).supportsModel(model);
}

function is_effort_supported(harness: Harness): boolean {
    return get_harness(harness).supportsEffort;
}

export {
    CredentialSource,
    AgentHarness,
    ClaudeHarness,
    CodexHarness,
    OpenCodeHarness,
    HARNESS_REGISTRY,
    get_harness,
    is_model_supported,
    is_effort_supported,
};
export type { HarnessInvocationInput };
