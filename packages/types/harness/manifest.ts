import { Harness } from "../prisma/enums.prisma";

export const HARNESS_MODELS: Record<Harness, string[]> = {
    [Harness.Claude]: ["claude-fable-5", "claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"],
    [Harness.Codex]: [
        "gpt-5.6-luna",
        "gpt-5.6-terra",
        "gpt-5.6-sol",
        "gpt-5.6-sol-pro",
        "gpt-5.6-sol-ultra",
    ],
    [Harness.OpenCode]: [
        "openrouter/deepseek/deepseek-v3.2",
        "openrouter/minimax/minimax-m2",
        "openrouter/qwen/qwen3-coder",
        "openrouter/z-ai/glm-4.7",
    ],
};

export const HARNESS_SUPPORTS_EFFORT: Record<Harness, boolean> = {
    [Harness.Claude]: true,
    [Harness.Codex]: true,
    [Harness.OpenCode]: false,
};
