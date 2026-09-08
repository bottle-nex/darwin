import { Harness } from "@trydarwin/database";
import { type AgentHarness } from "./harness";
import ClaudeHarness from "./claude";
import CodexHarness from "./codex";
import OpenCodeHarness from "./opencode";

class Registry {
    private static readonly CLAUDE: AgentHarness = new ClaudeHarness();
    private static readonly CODEX: AgentHarness = new CodexHarness();
    private static readonly OPENCODE: AgentHarness = new OpenCodeHarness();

    static readonly all: readonly AgentHarness[] = [
        Registry.CLAUDE,
        Registry.CODEX,
        Registry.OPENCODE,
    ];

    static get(harness: Harness): AgentHarness {
        switch (harness) {
            case Harness.Claude:
                return Registry.CLAUDE;
            case Harness.Codex:
                return Registry.CODEX;
            case Harness.OpenCode:
                return Registry.OPENCODE;
        }
    }

    static supportsModel(harness: Harness, model: string): boolean {
        return Registry.get(harness).supportsModel(model);
    }

    static supportsEffort(harness: Harness): boolean {
        return Registry.get(harness).supportsEffort;
    }
}

export default Registry;
