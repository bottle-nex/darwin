"use client";

import {
    AddIcon,
    ChatsNavIcon,
    DeleteIcon,
    OverflowMenuIcon,
    TeamEntityIcon,
} from "@trydarwin/ui/icons";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetProject } from "@/hooks/project/useGetProject";
import { cn } from "@/lib/utils";
import { useChatThreadStore } from "@/store/playground/useChatThreadStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useDeleteTeamStore } from "@/store/team/useDeleteTeamStore";
import { useNewTeamStore } from "@/store/team/useNewTeamStore";

import { PlaygroundTab } from "../playgroundTabs";
import { rowLeading } from "./shared";
import Row from "./SidebarRow";
import Section from "./SidebarSection";

export default function PlaygroundSidebarTeamsSection() {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = projectSlug
        ? dashboard?.projects.find((p) => p.slug === projectSlug)
        : undefined;
    const { data: project } = useGetProject(activeProject?.id);
    const { setOpen, setTargetProjectId } = useNewTeamStore();
    const requestDelete = useDeleteTeamStore((s) => s.requestDelete);

    const isAdmin = project?.viewerRole === "Admin";
    const selectedTeam = usePlaygroundNavStore((s) => s.selectedTeam);
    const openTeam = usePlaygroundNavStore((s) => s.openTeam);
    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const selectTeamChat = useChatThreadStore((s) => s.selectTeam);
    const teams = project?.teams ?? [];

    function openCreateTeam() {
        if (!activeProject) return;
        setTargetProjectId(activeProject.id);
        setOpen(true);
    }

    function openTeamChat(teamId: string) {
        selectTeamChat(teamId);
        setTab(PlaygroundTab.Chats);

        const params = new URLSearchParams(window.location.search);
        params.set("tab", PlaygroundTab.Chats);
        params.set("teamChat", teamId);
        params.delete("team");
        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    }

    return (
        <Section title="Teams" variant="tree" icon={TeamEntityIcon}>
            {teams.map((t) => {
                const isActive = selectedTeam?.id === t.id;
                return (
                    <div key={t.id} className="group/team relative">
                        <Row
                            className={cn(
                                !isActive &&
                                    "group-hover/team:bg-active group-hover/team:text-neutral-100",
                            )}
                            label={t.name}
                            leading={rowLeading({
                                kind: "pick",
                                pick: t.icon,
                                fallback: TeamEntityIcon,
                            })}
                            active={isActive}
                            indent={22}
                            onClick={() => openTeam(t, projectSlug ?? "")}
                        />
                        {(t.viewerRole || isAdmin) && (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="unstyled"
                                        type="button"
                                        aria-label={`${t.name} actions`}
                                        className={cn(
                                            "absolute top-1/2 right-1 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-neutral-400 ring-inset transition-opacity hover:bg-overlay/5 hover:text-neutral-200 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden group-hover/team:pointer-events-auto group-hover/team:opacity-100 data-[state=open]:pointer-events-auto data-[state=open]:opacity-100",
                                            isActive
                                                ? "opacity-100"
                                                : "pointer-events-none opacity-0",
                                        )}
                                    >
                                        <OverflowMenuIcon className="size-4" aria-hidden />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    {t.viewerRole && (
                                        <DropdownMenuItem onSelect={() => openTeamChat(t.id)}>
                                            <ChatsNavIcon className="size-3.5" aria-hidden />
                                            <span className="flex-1">Chat</span>
                                        </DropdownMenuItem>
                                    )}
                                    {isAdmin && (
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onSelect={() => requestDelete(t)}
                                        >
                                            <DeleteIcon className="size-3.5" aria-hidden />
                                            <span className="flex-1">Delete</span>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                );
            })}
            {isAdmin && (
                <Row
                    label="Add team"
                    leading={{ kind: "icon", icon: AddIcon }}
                    indent={22}
                    onClick={openCreateTeam}
                />
            )}
        </Section>
    );
}
