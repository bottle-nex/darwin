import {
    RUN_LOG_MAX_COMMAND_LENGTH,
    RUN_LOG_MAX_FAILURE_OUTPUT_LENGTH,
    RUN_LOG_MAX_NOTICE_LENGTH,
    RUN_LOG_MAX_PATH_LENGTH,
    type RunLogEventBody,
    RunLogEventKind,
} from "@trymatcha/types";
import { z } from "zod";

export const REPORT_PROGRESS_DESCRIPTION = [
    "Record what you just did so the person watching this run can follow along.",
    "Call this immediately after each meaningful action: reading a file, editing or creating a file,",
    "searching, or running a command. Report the action itself, never its contents or output —",
    "the file diff and the command results are shown separately.",
    "One action per call. If you read three files, call this three times with one path each;",
    "never combine several paths or commands into a single report.",
].join(" ");

export const report_progress_schema = {
    kind: z.enum([
        RunLogEventKind.FileRead,
        RunLogEventKind.FileWrite,
        RunLogEventKind.Search,
        RunLogEventKind.Command,
        RunLogEventKind.CommandFailed,
        RunLogEventKind.Notice,
    ]),
    path: z.string().optional(),
    mode: z.enum(["edit", "create"]).optional(),
    pattern: z.string().optional(),
    command: z.string().optional(),
    output: z.string().optional(),
    text: z.string().optional(),
};

export type ReportProgressArgs = {
    kind: RunLogEventKind;
    path?: string;
    mode?: "edit" | "create";
    pattern?: string;
    command?: string;
    output?: string;
    text?: string;
};

const REPO_DIR = "/home/user/repo";

const head = (value: string | undefined, limit: number) => (value ?? "").trim().slice(0, limit);

const repo_relative = (path: string) =>
    path.startsWith(`${REPO_DIR}/`) ? path.slice(REPO_DIR.length + 1) : path;

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
            return command ? { kind: RunLogEventKind.Command, command } : null;
        }
        case RunLogEventKind.CommandFailed: {
            const command = head(args.command, RUN_LOG_MAX_COMMAND_LENGTH);
            return command
                ? {
                      kind: RunLogEventKind.CommandFailed,
                      command,
                      output: tail(args.output, RUN_LOG_MAX_FAILURE_OUTPUT_LENGTH),
                  }
                : null;
        }
        default: {
            const text = head(args.text, RUN_LOG_MAX_NOTICE_LENGTH);
            return text ? { kind: RunLogEventKind.Notice, text } : null;
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
