import {
    run_log_level,
    type RunLogEventBody,
    RunLogEventKind,
    RunLogLevel,
    type RunLogPhase,
} from "@trymatcha/types";
import chalk from "chalk";

import { truncate } from "../sandbox/service.stream";

const MAX_TEXT = 160;

const NOTICE_TONE: Record<RunLogLevel, (text: string) => string> = {
    [RunLogLevel.Info]: chalk.dim,
    [RunLogLevel.Warn]: chalk.yellowBright,
    [RunLogLevel.Error]: chalk.red,
};

function seconds(ms: number): string {
    return ms < 1000 ? "under a second" : `${Math.round(ms / 1000)}s`;
}

export function render_event(event: RunLogEventBody, phase: RunLogPhase): string {
    switch (event.kind) {
        case RunLogEventKind.AgentFinished:
            return chalk.blue(`▪ [${phase}] agent finished in ${seconds(event.durationMs)}`);
        case RunLogEventKind.ChangesSummary:
            return chalk.blue(
                `▪ changed ${event.files} files (+${event.insertions} −${event.deletions})`,
            );
        case RunLogEventKind.RunFailed:
            return chalk.red(`✗ run failed — ${truncate(event.reason, MAX_TEXT)}`);
        case RunLogEventKind.Step:
            return chalk.magenta(`◆ ${truncate(event.text, MAX_TEXT)}`);
        case RunLogEventKind.FileRead:
            return `${chalk.cyan("⟩")} ${chalk.cyan(`read ${event.path}`)}`;
        case RunLogEventKind.FileWrite:
            return `${chalk.cyan("⟩")} ${chalk.cyan(`${event.mode} ${event.path}`)}`;
        case RunLogEventKind.Search:
            return `${chalk.cyan("⟩")} ${chalk.cyan(`search "${event.pattern}"`)}`;
        case RunLogEventKind.CommandFailed:
            return `${chalk.yellowBright("✗")} ${chalk.yellowBright(`$ ${event.command}`)}`;
        case RunLogEventKind.Notice:
            return NOTICE_TONE[run_log_level(event)](truncate(event.text, MAX_TEXT));
    }
}
