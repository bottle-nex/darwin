"use client";
import { useMemo } from "react";
import type { AgentSession, IssueActivity } from "@trymatcha/types";
import { useActivity } from "@/hooks/activity/useActivity";
import LogoLoader from "@/components/app/LogoLoader";
import ActivityRow from "./ActivityRow";
import AgentSessionCard from "./AgentSessionCard";

type FeedEntry =
    | { kind: "activity"; at: number; activity: IssueActivity }
    | { kind: "session"; at: number; session: AgentSession; rows: IssueActivity[] };

function entryKey(entry: FeedEntry): string {
    return entry.kind === "session" ? entry.session.id : entry.activity.id;
}

/**
 * Rows that belong to an agent run are pulled out and nested under that run's
 * card, which is anchored at the earliest row of the group.
 */
function build_entries(activities: IssueActivity[] | undefined): FeedEntry[] {
    const grouped = new Map<string, IssueActivity[]>();
    for (const row of activities ?? []) {
        if (!row.sessionId) continue;
        const held = grouped.get(row.sessionId);
        if (held) held.push(row);
        else grouped.set(row.sessionId, [row]);
    }

    const entries: FeedEntry[] = [];
    const consumed = new Set<string>();
    for (const row of activities ?? []) {
        const rows = row.sessionId ? grouped.get(row.sessionId) : undefined;
        // A group whose session row didn't come back stays as loose rows rather
        // than disappearing behind a card that can't render.
        if (!rows || !row.session) {
            entries.push({
                kind: "activity",
                at: new Date(row.createdAt).getTime(),
                activity: row,
            });
            continue;
        }
        if (consumed.has(row.sessionId!)) continue;
        consumed.add(row.sessionId!);
        entries.push({
            kind: "session",
            at: new Date(row.session.startedAt).getTime(),
            session: row.session,
            rows,
        });
    }

    return entries.sort((a, b) => a.at - b.at);
}

export default function ActivityFeed({ issueId }: { issueId?: string }) {
    const { data: activities, isLoading } = useActivity(issueId);
    const entries = useMemo(() => build_entries(activities), [activities]);

    return (
        <section className="flex min-w-0 flex-col gap-y-3 pt-2">
            <h2 className="text-[13px] font-medium text-neutral-400">Activity</h2>
            {isLoading ? (
                <LogoLoader size={28} className="py-6" />
            ) : entries.length === 0 ? (
                <p className="py-4 text-[13px] text-neutral-500">
                    {issueId ? "Nothing here yet." : "Save the issue to start its timeline."}
                </p>
            ) : (
                <ul className="flex min-w-0 flex-col">
                    {entries.map((entry, i) =>
                        entry.kind === "session" ? (
                            <AgentSessionCard
                                key={entryKey(entry)}
                                session={entry.session}
                                rows={entry.rows}
                            />
                        ) : (
                            <ActivityRow
                                key={entryKey(entry)}
                                activity={entry.activity}
                                rail={{
                                    above: entries[i - 1]?.kind === "activity",
                                    below: entries[i + 1]?.kind === "activity",
                                }}
                            />
                        ),
                    )}
                </ul>
            )}
        </section>
    );
}
