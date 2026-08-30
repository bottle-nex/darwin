import { type RunLogEventBody, RunLogEventKind, type RunLogPhase } from "@trymatcha/types";
import chalk from "chalk";

import { truncate } from "../sandbox/service.stream";

const MAX_TEXT = 160;

export function render_event(event: RunLogEventBody, phase: RunLogPhase): string {
    switch (event.kind) {
        case RunLogEventKind.Phase:
            return chalk.dim(`── ${phase}`);
        case RunLogEventKind.Thought:
            return chalk.magenta(`✻ thought for ${Math.round(event.durationMs / 1000)}s`);
        case RunLogEventKind.FileRead:
            return `${chalk.cyan("⟩")} ${chalk.cyan(`read ${event.path}`)}`;
        case RunLogEventKind.FileWrite:
            return `${chalk.cyan("⟩")} ${chalk.cyan(`${event.mode} ${event.path}`)}`;
        case RunLogEventKind.Search:
            return `${chalk.cyan("⟩")} ${chalk.cyan(`search "${event.pattern}"`)}`;
        case RunLogEventKind.Command:
            return `${chalk.cyan("⟩")} ${chalk.cyan(`$ ${event.command}`)}`;
        case RunLogEventKind.CommandFailed:
            return `${chalk.yellowBright("✗")} ${chalk.yellowBright(`$ ${event.command}`)}`;
        case RunLogEventKind.Notice:
            return chalk.dim(truncate(event.text, MAX_TEXT));
        case RunLogEventKind.Failure:
            return chalk.red(truncate(event.text, MAX_TEXT));
    }
}
