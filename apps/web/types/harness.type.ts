import type { Effort, Harness } from "@trymatcha/types";

export type { Effort, Harness } from "@trymatcha/types";
export { HARNESS_MODELS, HARNESS_SUPPORTS_EFFORT } from "@trymatcha/types";

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

export interface IssueConfigResponse {
    config: {
        harness: Harness;
        model: string | null;
        effort: Effort | null;
    };
    is_override: boolean;
}
