import {
    RUN_LOG_MAX_COMMAND_LENGTH,
    RUN_LOG_MAX_NOTICE_LENGTH,
    RUN_LOG_MAX_OUTPUT_LENGTH,
    RUN_LOG_MAX_PATH_LENGTH,
    RUN_LOG_MAX_STEP_LENGTH,
    RUN_LOG_MAX_TITLE_LENGTH,
    type RunLogEventBody,
    RunLogEventKind,
    RunLogLevel,
} from "@trymatcha/types";
import { z } from "zod";

export const REPORT_PROGRESS_DESCRIPTION = [
    "Record what you just did so the person watching this run can follow along.",
    "Call this immediately after each meaningful action: reading a file, editing or creating a file,",
    "searching, or running a command. Report the action itself, never its contents or output —",
    "the file diff and the command results are shown separately.",
    "One action per call. If you read three files, call this three times with one path each;",
    "never combine several paths or commands into a single report.",
    "A notice takes a level: use warn when something did not go to plan but the run continues,",
    "and error when it leaves the run unable to finish. Anything else is info.",
    "When you report a command, give it a title: a short plain sentence naming what you were",
    "trying to achieve, not what you typed — 'Retry GitHub API for profile', never 'run curl'.",
    "Send the command you ran and the output you got back; the person reading sees both folded",
    "behind that title, and the title is all they see until they open it.",
    "Use kind 'step' when you turn to a new part of the work, before you start it. Say the goal in",
    "one short plain sentence — 'Finding where the navbar tiles are defined', not 'Calling Grep'.",
    "The person reading has not seen your reasoning, so a step is the only place they learn what you",
    "are trying to do and why the actions that follow make sense. Expect roughly five to ten steps",
    "across a whole run: a step marks a change of intent, never a single file or command.",
].join(" ");

export const report_progress_schema = {
    kind: z.enum([
        RunLogEventKind.FileRead,
        RunLogEventKind.FileWrite,
        RunLogEventKind.Search,
        RunLogEventKind.Command,
        RunLogEventKind.Notice,
        RunLogEventKind.Step,
    ]),
    title: z.string().optional(),
    path: z.string().optional(),
    mode: z.enum(["edit", "create"]).optional(),
    pattern: z.string().optional(),
    command: z.string().optional(),
    output: z.string().optional(),
    exitCode: z.number().int().optional(),
    text: z.string().optional(),
    level: z.enum([RunLogLevel.Info, RunLogLevel.Warn, RunLogLevel.Error]).optional(),
};

export type ReportProgressArgs = {
    kind: RunLogEventKind;
    title?: string;
    path?: string;
    mode?: "edit" | "create";
    pattern?: string;
    command?: string;
    output?: string;
    exitCode?: number;
    text?: string;
    level?: RunLogLevel;
};

const REPO_DIR = "/home/user/repo";

const head = (value: string | undefined, limit: number) => (value ?? "").trim().slice(0, limit);

/**
 * A path inside the repo, or null for anything else. The sandbox holds our own scaffolding beside
 * the clone, and a write there is not a change to the reader's code.
 */
const repo_relative = (path: string): string | null =>
    path.startsWith(`${REPO_DIR}/`) ? path.slice(REPO_DIR.length + 1) : null;

/**
 * A failure is described by its last lines, not its first: the command is already named on the
 * event, and what a reader needs from the output is the error it ended on.
 */
const tail = (value: string | undefined, limit: number) => {
    const text = (value ?? "").trim();
    return text.length > limit ? text.slice(-limit) : text;
};

/**
 * Shapes one reported action into a log event, discarding whatever the caller sent that the
 * event does not carry.
 *
 * Trimming happens here, inside the sandbox, rather than on the receiving side: the agent is
 * free to pass a whole file or a megabyte of build output, and none of it should ever reach the
 * network. Returns null when the report says nothing identifiable, so an empty call is dropped
 * at the source instead of becoming a blank row in the run.
 */
export function to_run_log_event(args: ReportProgressArgs): RunLogEventBody | null {
    switch (args.kind) {
        case RunLogEventKind.FileRead: {
            const path = repo_relative(head(args.path, RUN_LOG_MAX_PATH_LENGTH));
            return path ? { kind: RunLogEventKind.FileRead, path } : null;
        }
        case RunLogEventKind.FileWrite: {
            const path = repo_relative(head(args.path, RUN_LOG_MAX_PATH_LENGTH));
            return path
                ? { kind: RunLogEventKind.FileWrite, path, mode: args.mode ?? "edit" }
                : null;
        }
        case RunLogEventKind.Search: {
            const pattern = head(args.pattern, RUN_LOG_MAX_COMMAND_LENGTH);
            return pattern ? { kind: RunLogEventKind.Search, pattern } : null;
        }
        case RunLogEventKind.Command: {
            const command = head(args.command, RUN_LOG_MAX_COMMAND_LENGTH);
            if (!command) return null;
            return {
                kind: RunLogEventKind.Command,
                command,
                title: head(args.title, RUN_LOG_MAX_TITLE_LENGTH) || undefined,
                output: tail(args.output, RUN_LOG_MAX_OUTPUT_LENGTH) || undefined,
                exitCode: args.exitCode,
            };
        }
        case RunLogEventKind.Step: {
            const text = head(args.text, RUN_LOG_MAX_STEP_LENGTH);
            return text ? { kind: RunLogEventKind.Step, text } : null;
        }
        default: {
            const text = head(args.text, RUN_LOG_MAX_NOTICE_LENGTH);
            if (!text) return null;
            return { kind: RunLogEventKind.Notice, text, level: args.level ?? RunLogLevel.Info };
        }
    }
}

const DELIVERY_ATTEMPTS = 3;
const DELIVERY_BACKOFF_MS = 200;

/**
 * A deadline per attempt, because the failure this guards against is a worker that accepts the
 * connection and never answers. A crash is reported back as an error and retried; a wedged
 * process is silent, and without a bound here the agent waits on it forever.
 */
const DELIVERY_TIMEOUT_MS = 3_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type RunLogDelivery = {
    run_id: string;
    seq: number;
    event: RunLogEventBody;
};

/**
 * Delivers one event to the vm worker, retrying until it is stored or the attempts run out.
 *
 * The sequence number does not change between attempts, and that is what makes retrying safe:
 * the worker stores events by sequence, so a report that arrived but whose response was lost is
 * recognised as the same event rather than recorded twice.
 *
 * Only a server-side failure is retried. A rejection in the 4xx range says the report itself is
 * the problem, and sending the identical body again would fail the identical way.
 */
export async function deliver_run_log(
    vm_url: string,
    token: string,
    delivery: RunLogDelivery,
): Promise<boolean> {
    for (let attempt = 1; attempt <= DELIVERY_ATTEMPTS; attempt += 1) {
        try {
            const response = await fetch(`${vm_url}/run-logs`, {
                method: "POST",
                headers: {
                    authorization: `Bearer ${token}`,
                    "content-type": "application/json",
                },
                body: JSON.stringify(delivery),
                signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
            });
            if (response.ok) return true;
            if (response.status < 500) return false;
        } catch {
            // unreachable or mid-flight failure — the same sequence number goes back out
        }

        if (attempt < DELIVERY_ATTEMPTS) await sleep(DELIVERY_BACKOFF_MS * attempt);
    }
    return false;
}
