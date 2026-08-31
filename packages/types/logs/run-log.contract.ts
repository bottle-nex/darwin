export const RunLogEventKind = {
    Phase: "phase",
    Thought: "thought",
    FileRead: "file_read",
    FileWrite: "file_write",
    Search: "search",
    Command: "command",
    CommandFailed: "command_failed",
    Notice: "notice",
    Failure: "failure",
} as const;
export type RunLogEventKind = (typeof RunLogEventKind)[keyof typeof RunLogEventKind];

export const RunLogPhase = {
    Setup: "setup",
    Plan: "plan",
    Agent: "agent",
    Verify: "verify",
    Publish: "publish",
} as const;
export type RunLogPhase = (typeof RunLogPhase)[keyof typeof RunLogPhase];

export const RunLogState = {
    Live: "live",
    Sealed: "sealed",
    Absent: "absent",
} as const;
export type RunLogState = (typeof RunLogState)[keyof typeof RunLogState];

export type RunLogEventBody =
    | { kind: typeof RunLogEventKind.Phase }
    | { kind: typeof RunLogEventKind.Thought; durationMs: number }
    | { kind: typeof RunLogEventKind.FileRead; path: string }
    | { kind: typeof RunLogEventKind.FileWrite; path: string; mode: "edit" | "create" }
    | { kind: typeof RunLogEventKind.Search; pattern: string }
    | { kind: typeof RunLogEventKind.Command; command: string }
    | { kind: typeof RunLogEventKind.CommandFailed; command: string; output: string }
    | { kind: typeof RunLogEventKind.Notice; text: string }
    | { kind: typeof RunLogEventKind.Failure; text: string };

export type RunLogEvent = RunLogEventBody & {
    seq: number;
    ts: string;
    phase: RunLogPhase;
};

export type RunLogPage = {
    runId: string;
    state: RunLogState;
    events: RunLogEvent[];
    cursor: number | null;
    droppedEvents: number;
    truncated: boolean;
};

export const RUN_LOG_PAGE_LIMIT = 500;
export const RUN_LOG_ARCHIVE_EVENT_CAP = 20_000;

export const RUN_LOG_HOT_TTL_SECONDS = 6 * 60 * 60;
export const RUN_LOG_MAX_BYTES = 8 * 1024 * 1024;

export const RUN_LOG_MAX_PATH_LENGTH = 256;
export const RUN_LOG_MAX_COMMAND_LENGTH = 512;
export const RUN_LOG_MAX_NOTICE_LENGTH = 500;
export const RUN_LOG_MAX_FAILURE_OUTPUT_LENGTH = 2_000;

export const RUN_LOG_CACHE_INDEX_KEY = "run-logs:index";

export function run_log_cache_key(run_id: string): string {
    return `run-logs:${run_id}:events`;
}

export function run_log_meta_key(run_id: string): string {
    return `run-logs:${run_id}:meta`;
}

// Segments live under their own prefix so the combined archive can sit beside them without
// being picked up by the listing that later deletes them.
export function run_log_prefix(project_id: string, run_id: string): string {
    return `run-logs/${project_id}/${run_id}/segments/`;
}

// The sequence number is zero-padded because segments are read back in the order object
// storage lists them, which is plain lexicographic sorting.
export function run_log_segment_key(project_id: string, run_id: string, first_seq: number): string {
    const ordered = String(first_seq).padStart(12, "0");
    return `${run_log_prefix(project_id, run_id)}${ordered}.jsonl.gz`;
}

export function run_log_object_key(project_id: string, run_id: string): string {
    return `run-logs/${project_id}/${run_id}/run.jsonl.gz`;
}

// TextEncoder rather than Buffer: this module is bundled into the browser too, where Buffer
// is not defined.
export function run_log_event_bytes(event: RunLogEvent): number {
    return new TextEncoder().encode(JSON.stringify(event)).length;
}
