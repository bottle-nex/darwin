"use client";
import type { DarwinThreadSummary } from "@trydarwin/types";
import { DarwinChatIcon, DeleteIcon, EditIcon, OverflowMenuIcon } from "@trydarwin/ui/icons";
import { useState } from "react";

import { short_age } from "@/components/playground/Core/Notifications/notificationView";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import {
    useDeleteDarwinThread,
    useRenameDarwinThread,
} from "@/hooks/darwin/useDarwinThreadActions";
import { useDarwinThreads } from "@/hooks/darwin/useDarwinThreads";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import { useDarwinThreadStore } from "@/store/playground/useDarwinThreadStore";

import { filterDarwinThreads } from "./darwinThreads";
import Row from "./SidebarRow";
import Section from "./SidebarSection";

const UNTITLED = "Untitled chat";

// Mirrors the teams row: hidden until the row is hovered, the active one, or the menu is open,
// so a list of chats stays a list of titles rather than a column of dots.
const MENU_BUTTON =
    "absolute top-1/2 right-1 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-neutral-400 ring-inset transition-opacity hover:bg-overlay/5 hover:text-neutral-200 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden group-hover/thread:pointer-events-auto group-hover/thread:opacity-100 data-[state=open]:pointer-events-auto data-[state=open]:opacity-100";

/**
 * The sidebar's Darwin face: past conversations, newest first.
 *
 * Mirrors {@link PlaygroundSidebarSettingsPanel} — it replaces the sidebar body rather than
 * opening beside it, so it inherits the sidebar's width, resize and collapse for free, and its
 * back, search and "new chat" live in the shared header rather than as rows in the list.
 *
 * Threads are private to whoever opened them, so this is one person's history, not the team's.
 */
export default function PlaygroundSidebarDarwinPanel({ query }: { query: string }) {
    const project = useActiveProject();
    const threads = useDarwinThreads(project?.id);
    const threadId = useDarwinThreadStore((state) => state.threadId);
    const openThread = useDarwinThreadStore((state) => state.open);
    const startNewChat = useDarwinThreadStore((state) => state.reset);
    const rename = useRenameDarwinThread(project?.id);
    const remove = useDeleteDarwinThread(project?.id);
    const [draft, setDraft] = useState<{ id: string; title: string } | null>(null);
    const [pendingDelete, setPendingDelete] = useState<DarwinThreadSummary | null>(null);

    const { threads: rows, topMatch } = filterDarwinThreads(threads.data ?? [], query);
    const searching = Boolean(query.trim());

    function commitRename(thread: DarwinThreadSummary) {
        const title = draft?.title.trim();
        if (title && title !== thread.title) rename.mutate({ threadId: thread.id, title });
        setDraft(null);
    }

    // The open thread is gone once it is deleted, so the pane falls back to a new chat rather
    // than asking the server for a thread that no longer exists.
    function confirmDelete() {
        if (!pendingDelete) return;
        if (pendingDelete.id === threadId) startNewChat();
        remove.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) });
    }

    return (
        <>
            <Section title="Chats">
                {rows.length === 0 ? (
                    <p className="px-2 py-1.5 text-[12.5px] text-neutral-500">
                        {threads.isLoading
                            ? "Loading…"
                            : searching
                              ? "No chats match."
                              : "No chats yet."}
                    </p>
                ) : (
                    rows.map((thread) =>
                        draft?.id === thread.id ? (
                            <Input
                                key={thread.id}
                                autoFocus
                                variant="ghost"
                                value={draft.title}
                                onChange={(event) =>
                                    setDraft({ id: thread.id, title: event.target.value })
                                }
                                onBlur={() => commitRename(thread)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        commitRename(thread);
                                    } else if (event.key === "Escape") {
                                        event.preventDefault();
                                        setDraft(null);
                                    }
                                }}
                                className="h-7 rounded-[5px] bg-overlay/5 px-2 text-[12.5px]"
                                aria-label="Chat name"
                            />
                        ) : (
                            <div key={thread.id} className="group/thread relative">
                                <Row
                                    className={cn(
                                        "pr-8",
                                        topMatch?.id === thread.id &&
                                            thread.id !== threadId &&
                                            "bg-active text-neutral-100",
                                    )}
                                    leading={{
                                        kind: "node",
                                        node: <DarwinChatIcon className="size-3.5" aria-hidden />,
                                    }}
                                    label={thread.title ?? UNTITLED}
                                    suffix={short_age(new Date(thread.updatedAt))}
                                    active={thread.id === threadId}
                                    onClick={() => openThread(thread.id)}
                                />

                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="unstyled"
                                            type="button"
                                            aria-label={`${thread.title ?? UNTITLED} actions`}
                                            className={cn(
                                                MENU_BUTTON,
                                                thread.id === threadId
                                                    ? "opacity-100"
                                                    : "pointer-events-none opacity-0",
                                            )}
                                        >
                                            <OverflowMenuIcon className="size-4" aria-hidden />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                        <DropdownMenuItem
                                            onSelect={() =>
                                                setDraft({
                                                    id: thread.id,
                                                    title: thread.title ?? "",
                                                })
                                            }
                                        >
                                            <EditIcon className="size-3.5" aria-hidden />
                                            <span className="flex-1">Rename</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onSelect={() => setPendingDelete(thread)}
                                        >
                                            <DeleteIcon className="size-3.5" aria-hidden />
                                            <span className="flex-1">Delete</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ),
                    )
                )}
            </Section>

            <ConfirmDialog
                open={pendingDelete !== null}
                onOpenChange={(next) => !next && setPendingDelete(null)}
                title="Delete chat?"
                description={
                    <>
                        This deletes{" "}
                        <span className="font-medium text-neutral-200">
                            {pendingDelete?.title ?? UNTITLED}
                        </span>{" "}
                        and everything said in it. This can&apos;t be undone.
                    </>
                }
                cancel={{
                    label: "Cancel",
                    variant: "tertiary",
                    onClick: () => setPendingDelete(null),
                }}
                confirm={{ label: "Delete", variant: "destructive", onClick: confirmDelete }}
                pending={remove.isPending}
                error={remove.isError ? "Couldn't delete the chat. Try again." : undefined}
            />
        </>
    );
}
