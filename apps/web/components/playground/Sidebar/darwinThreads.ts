import type { DarwinThreadSummary } from "@trydarwin/types";

/**
 * Narrow the chat list to what the sidebar search box matches.
 *
 * Mirrors {@link filterSettingsItems}: the panel renders `threads`, and the header's Enter key
 * commits `topMatch`, so both read the same filtered result rather than each deciding separately
 * what "the top one" is.
 *
 * @example
 * filterDarwinThreads(threads, "safari");
 * // { threads: [{ title: "Safari login bug", … }], topMatch: { … } }
 */
export function filterDarwinThreads(threads: DarwinThreadSummary[], query: string) {
    const needle = query.trim().toLowerCase();
    const matches = needle
        ? threads.filter((thread) => (thread.title ?? "").toLowerCase().includes(needle))
        : threads;

    return { threads: matches, topMatch: needle ? (matches[0] ?? null) : null };
}
