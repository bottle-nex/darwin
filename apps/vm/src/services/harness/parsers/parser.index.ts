import { Harness } from "@trydarwin/database";

import ClaudeEventParser from "./parser.claude";
import CodexEventParser from "./parser.codex";
import OpenCodeEventParser from "./parser.opencode";
import type { HarnessEventParser } from "./parser.types";

export function get_parser(harness: Harness): HarnessEventParser {
    switch (harness) {
        case Harness.Claude:
            return new ClaudeEventParser();
        case Harness.Codex:
            return new CodexEventParser();
        case Harness.OpenCode:
            return new OpenCodeEventParser();
    }
}

export type { AgentReport, HarnessEventParser } from "./parser.types";
