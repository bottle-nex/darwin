"use client";
import { HiChevronDown } from "react-icons/hi2";
import { MdCheck } from "react-icons/md";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { cn } from "@/lib/utils";
import type { Project, ProjectTeam } from "@/types/project";

export default function ChatsBreadcrumb({
    project,
    teams,
    selectedTeamId,
    onSelect,
}: {
    project: Project | undefined;
    teams: ProjectTeam[];
    selectedTeamId: string | null;
    onSelect: (teamId: string | null) => void;
}) {
    const selectedTeam = teams.find((team) => team.id === selectedTeamId);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="unstyled"
                    type="button"
                    disabled={!project}
                    className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 text-[13px] transition-colors hover:bg-white/5 disabled:cursor-default"
                >
                    <PlaygroundAvatar
                        tone="indigo"
                        size="md"
                        letter={project?.name.slice(0, 2).toUpperCase() ?? "?"}
                    />
                    {!project ? (
                        <span className="h-3 w-24 animate-pulse rounded bg-white/5" />
                    ) : (
                        <>
                            <span className="truncate font-medium text-neutral-200 capitalize">
                                {selectedTeam?.name ?? project.name}
                            </span>
                            <HiChevronDown className="size-3.5 shrink-0 text-neutral-500" />
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <ConversationItem
                    label={project?.name ?? "Project"}
                    letter={project?.name ?? "P"}
                    selected={!selectedTeam}
                    onSelect={() => onSelect(null)}
                />
                {teams.map((team) => (
                    <ConversationItem
                        key={team.id}
                        label={team.name}
                        letter={team.name}
                        selected={team.id === selectedTeamId}
                        onSelect={() => onSelect(team.id)}
                    />
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function ConversationItem({
    label,
    letter,
    selected,
    onSelect,
}: {
    label: string;
    letter: string;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <DropdownMenuItem onSelect={onSelect} className="flex cursor-pointer items-center gap-2">
            <PlaygroundAvatar tone="indigo" size="sm" letter={letter.slice(0, 2).toUpperCase()} />
            <span className="min-w-0 flex-1 truncate">{label}</span>
            <MdCheck className={cn("size-4 shrink-0 text-primary", !selected && "invisible")} />
        </DropdownMenuItem>
    );
}
