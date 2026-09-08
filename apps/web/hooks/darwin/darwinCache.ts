import type {
    DarwinResource,
    DarwinStreamEvent,
    DarwinThreadDetail,
    DarwinToolState,
    DarwinUiMessage,
} from "@trydarwin/types";

export type DarwinLiveTool = {
    callId: string;
    name: string;
    state: DarwinToolState;
    /** What the step produced, once it arrives. A step and its card are two events. */
    resource: DarwinResource | null;
};

export type DarwinLiveTurn = {
    runId: string;
    text: string;
    tools: DarwinLiveTool[];
    /** Highest seq applied, replayed back to the server when a reconnected socket resubscribes. */
    cursor: number;
    error: string | null;
};

/**
 * A thread plus whatever is still arriving.
 *
 * The in-flight answer is deliberately kept apart from `messages` rather than being appended as a
 * half-built row: nothing enters `messages` until the server has given it a real id, so a dropped
 * socket can never leave a phantom message behind.
 */
export type DarwinThreadView = DarwinThreadDetail & {
    live: DarwinLiveTurn | null;
};

export function emptyLiveTurn(runId: string): DarwinLiveTurn {
    return { runId, text: "", tools: [], cursor: 0, error: null };
}

/** Merges rather than replaces: the state and the resource arrive as separate events. */
function withTool(tools: DarwinLiveTool[], next: Partial<DarwinLiveTool> & { callId: string }) {
    const at = tools.findIndex((tool) => tool.callId === next.callId);
    if (at === -1) {
        return [
            ...tools,
            { name: "", state: "running" as DarwinToolState, resource: null, ...next },
        ];
    }
    const copy = [...tools];
    copy[at] = { ...copy[at]!, ...next };
    return copy;
}

function asMessage(live: DarwinLiveTurn, id: string, text: string): DarwinUiMessage {
    return {
        id,
        seq: Number.MAX_SAFE_INTEGER,
        role: "assistant",
        content: text,
        tools: live.tools.map((tool) => ({
            callId: tool.callId,
            name: tool.name,
            resource: tool.resource,
        })),
        createdAt: new Date().toISOString(),
    };
}

/**
 * Fold one batch of stream events into the rendered thread.
 *
 * Events arriving at or below the current cursor are dropped, because a socket that reconnects
 * mid-answer replays from its last cursor and the tail can overlap what is already applied.
 *
 * @example
 * applyDarwinEvents(view, runId, [{ seq: 4, type: "token", text: "Hi" }], 4);
 * // view.live.text === "Hi"
 */
export function applyDarwinEvents(
    view: DarwinThreadView,
    runId: string,
    events: DarwinStreamEvent[],
    cursor: number,
): DarwinThreadView {
    let live = view.live?.runId === runId ? view.live : emptyLiveTurn(runId);
    let messages = view.messages;
    let activeRunId: string | null = view.activeRunId ?? runId;

    for (const event of events) {
        if (event.seq <= live.cursor) continue;

        if (event.type === "token") {
            live = { ...live, text: live.text + event.text };
        } else if (event.type === "tool") {
            live = {
                ...live,
                tools: withTool(live.tools, {
                    callId: event.callId,
                    name: event.name,
                    state: event.state,
                }),
            };
        } else if (event.type === "resource") {
            live = {
                ...live,
                tools: withTool(live.tools, {
                    callId: event.callId,
                    resource: event.resource,
                }),
            };
        } else if (event.type === "done") {
            const text = event.text || live.text;
            if (!messages.some((message) => message.id === event.messageId)) {
                messages = [...messages, asMessage(live, event.messageId, text)];
            }
            live = { ...live, text: "" };
            activeRunId = null;
        } else if (event.type === "error") {
            live = { ...live, error: event.message };
        }

        live = { ...live, cursor: event.seq };
    }

    return {
        ...view,
        messages,
        activeRunId,
        live: { ...live, cursor: Math.max(live.cursor, cursor) },
    };
}

/**
 * Close out a run.
 *
 * A cancelled or failed run leaves whatever text arrived on screen so the user can see how far it
 * got; only a clean finish clears the live turn, because `done` has already promoted that text
 * into a real message.
 */
export function sealDarwinRun(
    view: DarwinThreadView,
    runId: string,
    status: "Done" | "Cancelled" | "Error",
): DarwinThreadView {
    if (view.live?.runId !== runId) return { ...view, activeRunId: null };
    if (status === "Done") return { ...view, activeRunId: null, live: null };

    const stopped = status === "Cancelled" ? "Stopped." : (view.live.error ?? "Darwin failed.");
    const messages = view.live.text
        ? [...view.messages, asMessage(view.live, `${runId}:partial`, view.live.text)]
        : view.messages;

    return {
        ...view,
        messages,
        activeRunId: null,
        live: { ...view.live, text: "", error: stopped },
    };
}
