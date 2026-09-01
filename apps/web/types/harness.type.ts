export type Harness = "Claude" | "Codex" | "OpenCode";

export type Effort = "Low" | "Medium" | "High" | "XHigh" | "Max";

export const HARNESS_OPTIONS: { id: Harness; label: string; description: string }[] = [
    { id: "Claude", label: "Claude", description: "Anthropic's Claude Code CLI." },
    { id: "Codex", label: "Codex", description: "OpenAI's Codex CLI." },
    { id: "OpenCode", label: "OpenCode", description: "Open-source, multi-provider CLI." },
];

export const EFFORT_OPTIONS: { id: Effort; label: string }[] = [
    { id: "Low", label: "Low" },
    { id: "Medium", label: "Medium" },
    { id: "High", label: "High" },
    { id: "XHigh", label: "Extra high" },
    { id: "Max", label: "Max" },
];

// Mirrors packages/harness's manifest. Duplicated rather than imported because that package
// pulls in @trymatcha/database (Prisma client, pg), which can't ship in a browser bundle.
export const HARNESS_MODELS: Record<Harness, string[]> = {
    Claude: ["claude-fable-5", "claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"],
    Codex: ["gpt-5.6-luna", "gpt-5.6-terra", "gpt-5.6-sol", "gpt-5.6-sol-pro", "gpt-5.6-sol-ultra"],
    OpenCode: [
        "opencode/gemini-3.1-pro",
        "opencode/minimax-m3",
        "opencode/grok-4.6",
        "opencode/grok-4.5",
        "opencode/deepseek-v4-flash",
        "opencode/mimo-v2.5-free",
        "opencode/kimi-k3",
    ],
};

export const HARNESS_SUPPORTS_EFFORT: Record<Harness, boolean> = {
    Claude: true,
    Codex: true,
    OpenCode: false,
};

export interface IssueHarnessConfig {
    harness: Harness;
    model: string | null;
    effort: Effort | null;
}

export interface IssueConfigResponse {
    config: IssueHarnessConfig;
    is_override: boolean;
}
