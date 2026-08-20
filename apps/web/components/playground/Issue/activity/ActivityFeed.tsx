"use client";
import { useMemo, useState } from "react";
import { to_plain_text, type AgentSession, type Chat, type IssueActivity } from "@trymatcha/types";
import { useActivity } from "@/hooks/activity/useActivity";
import { useIssueComments } from "@/hooks/chats/useIssueComments";
import LogoLoader from "@/components/app/LogoLoader";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import ChatComposer from "@/components/playground/Home/chat/ChatComposer";
import ActivityRow from "./ActivityRow";
import AgentSessionCard from "./AgentSessionCard";
import CommentCard, { type CommentThread } from "./CommentCard";

type ActivityEntry = { kind: "activity"; at: number; activity: IssueActivity };

type FeedEntry =
    | ActivityEntry
    | { kind: "session"; at: number; session: AgentSession; rows: IssueActivity[] }
    | { kind: "comment"; at: number; thread: CommentThread };

function millis(at: string | Date): number {
    return new Date(at).getTime();
}

function build_threads(comments: Chat[] | undefined): CommentThread[] {
    if (!comments?.length) return [];
    const by_id = new Map(comments.map((comment) => [comment.id, comment]));

    function root_of(comment: Chat): Chat {
        const seen = new Set<string>([comment.id]);
        let current = comment;
        while (current.repliedToId) {
            const parent = by_id.get(current.repliedToId);
            if (!parent || seen.has(parent.id)) break;
            seen.add(parent.id);
            current = parent;
        }
        return current;
    }

    const threads = new Map<string, CommentThread>();
    for (const comment of comments) {
        const root = root_of(comment);
        const held = threads.get(root.id);
        const thread = held ?? { root, replies: [] };
        if (!held) threads.set(root.id, thread);
        if (comment.id !== root.id) thread.replies.push(comment);
    }

    // A deleted root is only worth a tombstone while it still holds replies.
    return [...threads.values()]
        .filter((thread) => !thread.root.isDeleted || thread.replies.length > 0)
        .sort((a, b) => millis(a.root.createdAt) - millis(b.root.createdAt));
}

function build_entries(
    activities: IssueActivity[] | undefined,
    comments: Chat[] | undefined,
): FeedEntry[] {
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
            entries.push({ kind: "activity", at: millis(row.createdAt), activity: row });
            continue;
        }
        if (consumed.has(row.sessionId!)) continue;
        consumed.add(row.sessionId!);
        entries.push({
            kind: "session",
            at: millis(row.session.startedAt),
            session: row.session,
            rows,
        });
    }

    for (const thread of build_threads(comments)) {
        entries.push({ kind: "comment", at: millis(thread.root.createdAt), thread });
    }

    // sorting on the basis of time
    return entries.sort((a, b) => a.at - b.at);
}

function is_railed(entry: FeedEntry | undefined): boolean {
    return entry?.kind === "activity";
}

const EXCERPT_LIMIT = 120;

function excerpt(comment: Chat): string {
    const text = to_plain_text(comment.message, comment.references ?? []);
    return text.length > EXCERPT_LIMIT ? `${text.slice(0, EXCERPT_LIMIT).trimEnd()}...` : text;
}

function entry_key(entry: FeedEntry): string {
    switch (entry.kind) {
        case "session":
            return entry.session.id;
        case "comment":
            return entry.thread.root.id;
        default:
            return entry.activity.id;
    }
}

export default function ActivityFeed({ issueId }: { issueId?: string }) {
    const { data: activities, isLoading: activityLoading } = useActivity(issueId);
    const {
        comments,
        isLoading: commentsLoading,
        projectId,
        send,
        remove,
        react,
        canDelete,
    } = useIssueComments(issueId);

    const [pendingDelete, setPendingDelete] = useState<Chat | null>(null);

    const entries = useMemo(() => build_entries(activities, comments), [activities, comments]);

    const isLoading = activityLoading || commentsLoading;

    function confirmDelete() {
        if (!pendingDelete) return;
        remove(pendingDelete);
        setPendingDelete(null);
    }

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
                    {entries.map((entry, index) => {
                        const rail = {
                            above: is_railed(entries[index - 1]),
                            below: is_railed(entries[index + 1]),
                        };
                        switch (entry.kind) {
                            case "session":
                                return (
                                    <AgentSessionCard
                                        key={entry_key(entry)}
                                        session={entry.session}
                                        rows={entry.rows}
                                    />
                                );
                            case "comment":
                                return (
                                    <CommentCard
                                        key={entry_key(entry)}
                                        thread={entry.thread}
                                        projectId={projectId}
                                        onReply={send}
                                        onDelete={setPendingDelete}
                                        onReaction={react}
                                        canDelete={canDelete}
                                    />
                                );
                            default:
                                return (
                                    <ActivityRow
                                        key={entry_key(entry)}
                                        activity={entry.activity}
                                        rail={rail}
                                    />
                                );
                        }
                    })}
                </ul>
            )}
            <div className="pt-1">
                <ChatComposer
                    key={issueId ?? "unsaved"}
                    projectId={projectId}
                    placeholder={
                        issueId ? "Leave a comment..." : "Save the issue to start the conversation."
                    }
                    disabled={!issueId}
                    onSend={send}
                />
            </div>
            <ConfirmDialog
                open={Boolean(pendingDelete)}
                onOpenChange={(next) => !next && setPendingDelete(null)}
                title="Delete comment?"
                description={
                    <>
                        This removes{" "}
                        <span className="font-medium text-neutral-200">
                            &ldquo;{pendingDelete ? excerpt(pendingDelete) : ""}&rdquo;
                        </span>{" "}
                        from the timeline. You can&apos;t undo this.
                    </>
                }
                cancel={{
                    label: "Cancel",
                    variant: "tertiary",
                    onClick: () => setPendingDelete(null),
                }}
                confirm={{ label: "Delete", variant: "destructive", onClick: confirmDelete }}
            />
        </section>
    );
}
