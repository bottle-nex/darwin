"use client";
import type {
    GlobalSearchMessageHit,
    GlobalSearchMessageThread,
    GlobalSearchResult,
} from "@trymatcha/types";
import { ChatsNavIcon } from "@trymatcha/ui/icons";

import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { useIssueIdentifier } from "@/hooks/issues/useIssueIdentifier";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";
import { useChatThreadStore } from "@/store/playground/useChatThreadStore";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

const ITEM_CLASS = "items-start gap-2 p-2.5 text-[13.5px]";

export default function CommandSearchResults({
    result,
    isFetching,
    isError,
    onDone,
}: {
    result: GlobalSearchResult | undefined;
    isFetching: boolean;
    isError: boolean;
    onDone: () => void;
}) {
    const openIssue = usePaneRouteStore((s) => s.openIssue);
    const openThread = useOpenSearchThread(openIssue);
    const identifier = useIssueIdentifier();

    if (isError) {
        return (
            <CommandGroup heading="Search">
                <SearchNotice>Couldn&apos;t load results.</SearchNotice>
            </CommandGroup>
        );
    }

    if (!result) {
        return (
            <CommandGroup heading="Search">
                <SearchNotice>Searching…</SearchNotice>
            </CommandGroup>
        );
    }

    return (
        <div className={cn(isFetching && "opacity-60")}>
            {result.issues.length > 0 && (
                <CommandGroup heading="Issues">
                    {result.issues.map((hit) => {
                        const glyph = KanbanBoard.glyphFor(hit.status);
                        return (
                            <CommandItem
                                key={hit.id}
                                value={`issue ${hit.id}`}
                                onSelect={() => {
                                    onDone();
                                    openIssue(hit.id);
                                }}
                                className={ITEM_CLASS}
                            >
                                <glyph.icon
                                    className={cn("mt-0.5 size-4 shrink-0", glyph.titleBox)}
                                    aria-hidden
                                />
                                <span className="flex min-w-0 flex-col">
                                    <span className="flex min-w-0 items-center gap-1.5">
                                        <span className="shrink-0 text-neutral-500">
                                            {identifier(hit.number)}
                                        </span>
                                        <span className="truncate">{hit.title}</span>
                                    </span>
                                    {hit.snippet && (
                                        <span className="line-clamp-1 text-[11.5px] text-neutral-500">
                                            {hit.snippet}
                                        </span>
                                    )}
                                </span>
                            </CommandItem>
                        );
                    })}
                </CommandGroup>
            )}

            {result.messages.length > 0 && (
                <CommandGroup heading="Messages">
                    {result.messages.map((hit) => (
                        <CommandItem
                            key={hit.id}
                            value={`message ${hit.id}`}
                            onSelect={() => {
                                onDone();
                                openThread(hit.thread);
                            }}
                            className={ITEM_CLASS}
                        >
                            <ChatsNavIcon
                                className="mt-0.5 size-4 shrink-0 text-neutral-400"
                                aria-hidden
                            />
                            <span className="flex min-w-0 flex-col">
                                <span className="truncate">{hit.snippet}</span>
                                <span className="truncate text-[11.5px] text-neutral-500">
                                    {messageContext(hit, identifier)}
                                </span>
                            </span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            )}
        </div>
    );
}

function SearchNotice({ children }: { children: React.ReactNode }) {
    return <div className="px-2.5 py-2 text-[12.5px] text-neutral-500">{children}</div>;
}

function messageContext(
    hit: GlobalSearchMessageHit,
    identifier: (number: number | string) => string,
) {
    const where = threadLabel(hit.thread, identifier);
    return hit.senderName ? `${hit.senderName} · ${where}` : where;
}

function threadLabel(
    thread: GlobalSearchMessageThread,
    identifier: (number: number | string) => string,
) {
    if (thread.kind === "issue-comment") {
        return `${identifier(thread.issueNumber)} ${thread.issueTitle}`;
    }
    if (thread.kind === "team-chat") return thread.teamName;
    return "Project chat";
}

function useOpenSearchThread(openIssue: (issueId: string) => void) {
    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const selectProjectChat = useChatThreadStore((s) => s.selectProject);
    const selectTeamChat = useChatThreadStore((s) => s.selectTeam);

    return function open(thread: GlobalSearchMessageThread) {
        if (thread.kind === "issue-comment") {
            openIssue(thread.issueId);
            return;
        }

        const teamId = thread.kind === "team-chat" ? thread.teamId : null;
        if (teamId) selectTeamChat(teamId);
        else selectProjectChat();

        setTab(PlaygroundTab.Chats);

        const params = new URLSearchParams(window.location.search);
        params.set("tab", PlaygroundTab.Chats);
        if (teamId) params.set("teamChat", teamId);
        else params.delete("teamChat");
        window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
    };
}
