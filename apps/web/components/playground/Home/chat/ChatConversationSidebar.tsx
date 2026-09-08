"use client";
import { type ChatPreviewMessage, to_plain_text } from "@trydarwin/types";
import { AddIcon, SearchToggleIcon } from "@trydarwin/ui/icons";
import { AnimatePresence } from "motion/react";
import { useState } from "react";

import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { Button } from "@/components/ui/button";
import ExpandableSearchBar from "@/components/ui/ExpandableSearchBar";
import type { IconPick } from "@/components/ui/IconPicker";
import { useChatConversationPreviews } from "@/hooks/chats/useChatConversationPreviews";
import { cn } from "@/lib/utils";
import { useNewTeamStore } from "@/store/team/useNewTeamStore";

type Conversation = {
    id: string;
    name: string;
    icon?: IconPick | null;
};

type ProjectConversation = Conversation & {
    canCreateTeam: boolean;
};

type ChatConversationSidebarProps = {
    project: ProjectConversation | undefined;
    teams: Conversation[];
    selectedTeamId: string | null;
    onSelect: (teamId: string | null) => void;
};

function latest_message_text(message: ChatPreviewMessage | null | undefined) {
    if (!message) return "Say Hi!";
    if (message.isDeleted) return "Message deleted";
    return to_plain_text(message.message, message.references);
}

function ConversationRow({
    conversation,
    latestMessage,
    selected,
    onClick,
}: {
    conversation: Conversation;
    latestMessage: ChatPreviewMessage | null | undefined;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-current={selected ? "page" : undefined}
            onClick={onClick}
            className={cn(
                "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                selected ? "bg-active text-neutral-100" : "text-neutral-300 hover:bg-hover",
            )}
        >
            <PlaygroundAvatar
                letter={conversation.name.slice(0, 1).toUpperCase()}
                tone={toneFor(conversation.id)}
                icon={conversation.icon}
                size="lg"
                className="rounded-md"
            />
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] leading-4 font-medium">
                    {conversation.name}
                </span>
                <span
                    className={cn(
                        "mt-0.5 block truncate text-[11px] leading-4",
                        selected ? "text-neutral-400" : "text-neutral-500",
                    )}
                >
                    {latest_message_text(latestMessage)}
                </span>
            </span>
        </button>
    );
}

export default function ChatConversationSidebar({
    project,
    teams,
    selectedTeamId,
    onSelect,
}: ChatConversationSidebarProps) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const setCreateTeamOpen = useNewTeamStore((state) => state.setOpen);
    const setTargetProjectId = useNewTeamStore((state) => state.setTargetProjectId);
    const { data: previews, isLoading } = useChatConversationPreviews(project?.id);
    const team_previews = new Map(
        previews?.teams.map((preview) => [preview.teamId, preview.latestMessage]) ?? [],
    );
    const filtered_teams = teams.filter((team) =>
        team.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
    );

    function openCreateTeam() {
        if (!project?.canCreateTeam) return;
        setTargetProjectId(project.id);
        setCreateTeamOpen(true);
    }

    function closeSearch() {
        setSearchQuery("");
        setSearchOpen(false);
    }

    return (
        <aside className="flex min-h-0 w-80 max-w-[42%] shrink-0 flex-col border-r border-graphite">
            <nav data-lenis-prevent className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
                <section>
                    <h3 className="px-2 py-1.5 text-[12px] font-medium text-neutral-500 capitalize">
                        Project
                    </h3>
                    {project ? (
                        <ConversationRow
                            conversation={project}
                            latestMessage={previews?.project}
                            selected={selectedTeamId === null}
                            onClick={() => onSelect(null)}
                        />
                    ) : (
                        <div className="h-13 animate-pulse rounded-lg bg-graphite" />
                    )}
                </section>
                <section className="mt-3">
                    <AnimatePresence initial={false} mode="wait">
                        {searchOpen ? (
                            <ExpandableSearchBar
                                key="team-search"
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onClose={closeSearch}
                                placeholder="Search channels..."
                            />
                        ) : (
                            <div
                                key="team-header"
                                className="flex items-center justify-between px-2 py-1"
                            >
                                <h3 className="text-[12px] font-medium text-neutral-500 capitalize">
                                    Teams
                                </h3>
                                <div className="flex items-center gap-0.5">
                                    {project?.canCreateTeam && (
                                        <Button
                                            variant="unstyled"
                                            type="button"
                                            onClick={openCreateTeam}
                                            aria-label="Create team"
                                            className="flex size-6 cursor-pointer items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-100"
                                        >
                                            <AddIcon className="size-3.5" aria-hidden />
                                        </Button>
                                    )}
                                    <Button
                                        variant="unstyled"
                                        type="button"
                                        onClick={() => setSearchOpen(true)}
                                        aria-label="Search teams"
                                        className="flex size-6 cursor-pointer items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-100"
                                    >
                                        <SearchToggleIcon className="size-3.5" aria-hidden />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                    <div className="flex flex-col gap-px">
                        {filtered_teams.map((team) => (
                            <ConversationRow
                                key={team.id}
                                conversation={team}
                                latestMessage={team_previews.get(team.id)}
                                selected={selectedTeamId === team.id}
                                onClick={() => onSelect(team.id)}
                            />
                        ))}
                        {!filtered_teams.length && (
                            <p className="px-2.5 py-2 text-[11px] text-neutral-600">
                                {searchQuery ? "No team chats found" : "No team chats available"}
                            </p>
                        )}
                        {isLoading && teams.length > 0 && (
                            <span className="sr-only">Loading conversation previews</span>
                        )}
                    </div>
                </section>
            </nav>
        </aside>
    );
}
