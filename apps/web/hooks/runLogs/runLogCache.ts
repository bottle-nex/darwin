import { type RunLogEvent, type RunLogPage, RunLogState } from "@trymatcha/types";

export const RUN_LOG_CLIENT_EVENT_CAP = 20_000;

export function mergeRunLogEvents(
    existing: readonly RunLogEvent[],
    incoming: readonly RunLogEvent[],
): { events: RunLogEvent[]; trimmed: number } {
    if (!incoming.length) return { events: existing as RunLogEvent[], trimmed: 0 };

    const bySeq = new Map(existing.map((event) => [event.seq, event]));
    for (const event of incoming) bySeq.set(event.seq, event);

    const merged = [...bySeq.values()].sort((left, right) => left.seq - right.seq);
    const overflow = Math.max(0, merged.length - RUN_LOG_CLIENT_EVENT_CAP);
    return { events: overflow ? merged.slice(overflow) : merged, trimmed: overflow };
}

export function appendToRunLogPage(
    page: RunLogPage,
    incoming: readonly RunLogEvent[],
    cursor: number | null,
): RunLogPage {
    const { events, trimmed } = mergeRunLogEvents(page.events, incoming);
    if (events === page.events && cursor === page.cursor) return page;

    return {
        ...page,
        events,
        cursor: cursor ?? page.cursor,
        droppedEvents: page.droppedEvents + trimmed,
        truncated: page.truncated || trimmed > 0,
    };
}

export function mergeRunLogPage(existing: RunLogPage, incoming: RunLogPage): RunLogPage {
    const { events, trimmed } = mergeRunLogEvents(existing.events, incoming.events);
    return {
        ...incoming,
        events,
        droppedEvents: Math.max(existing.droppedEvents, incoming.droppedEvents) + trimmed,
        truncated: existing.truncated || incoming.truncated || trimmed > 0,
    };
}

export function sealRunLogPage(page: RunLogPage, droppedEvents: number): RunLogPage {
    return {
        ...page,
        state: RunLogState.Sealed,
        droppedEvents: Math.max(page.droppedEvents, droppedEvents),
    };
}
