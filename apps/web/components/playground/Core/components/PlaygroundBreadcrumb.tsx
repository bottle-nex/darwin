"use client";
import type { IconType } from "@trymatcha/ui/icons";
import { BreadcrumbSeparatorIcon, ICONS } from "@trymatcha/ui/icons";
import { Fragment } from "react";

import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { Button } from "@/components/ui/button";
import type { IconPick } from "@/components/ui/IconPicker";
import IconWrapper from "@/components/ui/IconWrapper";
import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import { NO_FOCUS, useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import type { BoardChapter, BoardIssue } from "@/types/board";

function ProjectIcon({ pick }: { pick: IconPick }) {
    if (pick.kind === "emoji") {
        return (
            <IconWrapper variant="ghost" className="size-4.25 shrink-0 px-0 text-[13px]">
                {pick.char}
            </IconWrapper>
        );
    }
    return (
        <IconWrapper
            icon={ICONS[pick.name as keyof typeof ICONS]}
            iconStyle={{ color: pick.color }}
            variant="solid"
            className="size-6 shrink-0"
            iconClassName="size-4.5"
        />
    );
}

export type PlaygroundBreadcrumbTarget = {
    tab: PlaygroundTab;
    chapter?: BoardChapter;
};

export type PlaygroundBreadcrumbSegment =
    | string
    | { label: string; onClick: () => void }
    | { label: string; target: PlaygroundBreadcrumbTarget };

export const PROJECT_BREADCRUMB_TARGET: PlaygroundBreadcrumbTarget = {
    tab: PlaygroundTab.Agent,
};

export const SETTINGS_BREADCRUMB_TARGET: PlaygroundBreadcrumbTarget = {
    tab: PlaygroundTab.SettingsAppearance,
};

/**
 * Where an issue's board crumb goes back to: the chapter it is parked in, or
 * the agent board when it isn't parked anywhere.
 */
export function breadcrumbTargetForIssue(
    chapter: BoardChapter | undefined,
): PlaygroundBreadcrumbTarget {
    return chapter ? { tab: PlaygroundTab.Chapter, chapter } : { tab: PlaygroundTab.Agent };
}

const TAB_TRAILS: Partial<Record<PlaygroundTab, PlaygroundBreadcrumbSegment[]>> = {
    [PlaygroundTab.Agent]: ["Agent"],
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

export default function PlaygroundBreadcrumb({
    issue,
    trail,
    trailing,
    trailingIcon,
}: {
    issue?: Pick<BoardIssue, "id" | "number" | "title" | "customColumnId">;
    trail?: PlaygroundBreadcrumbSegment[];
    trailing?: string;
    trailingIcon?: IconType;
}) {
    const project = useActiveProject();
    const { data: metadata } = useBoardColumns(project?.id);
    const openIssue = usePaneRouteStore((state) => state.openIssue);
    const tab = usePlaygroundNavStore((state) => state.tab) as PlaygroundTab;
    const setTab = usePlaygroundNavStore((state) => state.setTab);
    const openChapter = usePlaygroundNavStore((state) => state.openChapter);
    const selectedChapter = usePlaygroundNavStore((state) => state.selectedChapter);
    const setFocus = useKanbanOptionsStore((state) => state.setFocus);
    const inIssue = issue !== undefined;
    // An issue can be opened from Inbox or search, so its chapter is resolved
    // from the project-wide metadata rather than from whatever pane is showing.
    const issueChapterId = metadata?.columns.find(
        (column) => column.id === issue?.customColumnId,
    )?.chapterId;
    const issueChapter = metadata?.chapters.find((chapter) => chapter.id === issueChapterId);
    const issueIdentifier = issue
        ? `${(project?.name ?? "ISS").slice(0, 3).toUpperCase()}-${issue.number}`
        : undefined;
    const issueTrail: PlaygroundBreadcrumbSegment[] = issue
        ? [
              {
                  label: issueChapter?.name ?? "Agent",
                  target: breadcrumbTargetForIssue(issueChapter),
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
    const chapterTrail: PlaygroundBreadcrumbSegment[] = [selectedChapter?.name ?? "Chapter"];
    const segments = inIssue
        ? issueTrail
        : (trail ?? (tab === PlaygroundTab.Chapter ? chapterTrail : (TAB_TRAILS[tab] ?? [])));

    function navigate(target: PlaygroundBreadcrumbTarget) {
        setFocus(NO_FOCUS);
        if (target.chapter) openChapter(target.chapter, project?.slug ?? "");
        else setTab(target.tab);
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
                    className="flex min-w-0 cursor-pointer items-center gap-1.5 font-medium capitalize text-neutral-400 transition-colors hover:text-neutral-100"
                >
                    {project.icon && <ProjectIcon pick={project.icon} />}
                    <span className="truncate">{project.name}</span>
                </Button>
            ) : (
                <span className="flex min-w-0 items-center gap-1.5 font-medium capitalize text-neutral-200">
                    {project.icon && <ProjectIcon pick={project.icon} />}
                    <span className="truncate">{project.name}</span>
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
                        <BreadcrumbSeparatorIcon
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
                                    "flex min-w-0 items-center gap-1.5 font-medium",
                                    current ? "text-neutral-100" : "shrink-0 text-neutral-400",
                                )}
                            >
                                {current && trailingIcon && (
                                    <IconWrapper
                                        icon={trailingIcon}
                                        variant="ghost"
                                        className="size-5.25 shrink-0 hover:bg-none!"
                                        iconClassName="size-4"
                                    />
                                )}
                                <span className="truncate">{label}</span>
                            </span>
                        )}
                    </Fragment>
                );
            })}
        </nav>
    );
}
