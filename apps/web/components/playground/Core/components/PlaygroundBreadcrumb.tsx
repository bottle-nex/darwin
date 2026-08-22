"use client";
import { Fragment } from "react";
import { MdChevronRight } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import { NO_FOCUS, useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import type { BoardIssue } from "@/types/board";
import type { BoardView } from "@/types/kanban";

export type PlaygroundBreadcrumbTarget = {
    tab: PlaygroundTab;
    boardView?: BoardView;
};

export type PlaygroundBreadcrumbSegment =
    | string
    | { label: string; onClick: () => void }
    | { label: string; target: PlaygroundBreadcrumbTarget };

export const PROJECT_BREADCRUMB_TARGET: PlaygroundBreadcrumbTarget = {
    tab: PlaygroundTab.Kanban,
    boardView: "default",
};

export const SETTINGS_BREADCRUMB_TARGET: PlaygroundBreadcrumbTarget = {
    tab: PlaygroundTab.SettingsAppearance,
};

export function breadcrumbTargetForBoard(custom: boolean): PlaygroundBreadcrumbTarget {
    return {
        tab: PlaygroundTab.Kanban,
        boardView: custom ? "custom" : "llm",
    };
}

const TAB_TRAILS: Partial<Record<PlaygroundTab, PlaygroundBreadcrumbSegment[]>> = {
    [PlaygroundTab.Kanban]: ["Kanban"],
    [PlaygroundTab.Gantt]: ["Gantt"],
    [PlaygroundTab.Tags]: ["Tags"],
    [PlaygroundTab.Inbox]: ["Inbox"],
    [PlaygroundTab.Chats]: ["Chats"],
    [PlaygroundTab.AssignedToMe]: ["My issues"],
    [PlaygroundTab.SettingsAppearance]: [
        { label: "Settings", target: SETTINGS_BREADCRUMB_TARGET },
        "Appearance",
    ],
    [PlaygroundTab.SettingsApiKeys]: [
        { label: "Settings", target: SETTINGS_BREADCRUMB_TARGET },
        "API keys",
    ],
    [PlaygroundTab.SettingsProject]: [
        { label: "Settings", target: SETTINGS_BREADCRUMB_TARGET },
        "General",
    ],
    [PlaygroundTab.SettingsTemplates]: [
        { label: "Settings", target: SETTINGS_BREADCRUMB_TARGET },
        "Issue templates",
    ],
    [PlaygroundTab.SettingsEnv]: [
        { label: "Settings", target: SETTINGS_BREADCRUMB_TARGET },
        "Environment variables",
    ],
};

const KANBAN_BOARD_LABELS: Partial<Record<BoardView, string>> = {
    custom: "My Board",
    llm: "Agent",
};

export default function PlaygroundBreadcrumb({
    issue,
    trail,
    trailing,
}: {
    issue?: Pick<BoardIssue, "id" | "number" | "title" | "customColumnId">;
    trail?: PlaygroundBreadcrumbSegment[];
    trailing?: string;
}) {
    const project = useActiveProject();
    const openIssue = usePaneRouteStore((state) => state.openIssue);
    const tab = usePlaygroundNavStore((state) => state.tab) as PlaygroundTab;
    const setTab = usePlaygroundNavStore((state) => state.setTab);
    const boardView = useKanbanOptionsStore((state) => state.boardView);
    const setBoardView = useKanbanOptionsStore((state) => state.setBoardView);
    const setFocus = useKanbanOptionsStore((state) => state.setFocus);
    const inIssue = issue !== undefined;
    const issueIdentifier = issue
        ? `${(project?.name ?? "ISS").slice(0, 3).toUpperCase()}-${issue.number}`
        : undefined;
    const issueTrail: PlaygroundBreadcrumbSegment[] = issue
        ? [
              {
                  label: issue.customColumnId ? "My Board" : "Agent",
                  target: breadcrumbTargetForBoard(Boolean(issue.customColumnId)),
              },
              trailing
                  ? {
                        label: `${issueIdentifier} ${issue.title}`,
                        onClick: () => openIssue(issue.id),
                    }
                  : `${issueIdentifier} ${issue.title}`,
              ...(trailing ? [trailing] : []),
          ]
        : [];
    const kanbanTrail: PlaygroundBreadcrumbSegment[] = [KANBAN_BOARD_LABELS[boardView] ?? "Kanban"];
    const segments = inIssue
        ? issueTrail
        : (trail ?? (tab === PlaygroundTab.Kanban ? kanbanTrail : (TAB_TRAILS[tab] ?? [])));

    function navigate(target: PlaygroundBreadcrumbTarget) {
        if (target.boardView) {
            setFocus(NO_FOCUS);
            setBoardView(target.boardView);
        }
        setTab(target.tab);
    }

    return (
        <nav className="flex min-w-0 items-center gap-0.5 text-[13px]">
            {!project ? (
                <span className="h-3 w-24 animate-pulse rounded bg-white/5" />
            ) : segments.length ? (
                <Button
                    variant="unstyled"
                    type="button"
                    onClick={() => navigate(PROJECT_BREADCRUMB_TARGET)}
                    className="truncate font-medium capitalize text-neutral-400 transition-colors hover:text-neutral-100"
                >
                    {project.name}
                </Button>
            ) : (
                <span className="truncate font-medium capitalize text-neutral-200">
                    {project.name}
                </span>
            )}
            {segments.map((segment, index) => {
                const label = typeof segment === "string" ? segment : segment.label;
                const onClick =
                    typeof segment === "string"
                        ? undefined
                        : "onClick" in segment
                          ? segment.onClick
                          : () => navigate(segment.target);
                const current = index === segments.length - 1;

                return (
                    <Fragment key={`${label}-${index}`}>
                        <MdChevronRight
                            className="size-3.5 shrink-0 text-neutral-600"
                            aria-hidden
                        />
                        {onClick && !current ? (
                            <Button
                                variant="unstyled"
                                type="button"
                                onClick={onClick}
                                className="shrink-0 cursor-pointer font-medium text-neutral-400 transition-colors hover:text-neutral-100"
                            >
                                {label}
                            </Button>
                        ) : (
                            <span
                                aria-current={current ? "page" : undefined}
                                className={cn(
                                    "min-w-0 truncate font-medium",
                                    current ? "text-neutral-100" : "shrink-0 text-neutral-400",
                                )}
                            >
                                {label}
                            </span>
                        )}
                    </Fragment>
                );
            })}
        </nav>
    );
}
