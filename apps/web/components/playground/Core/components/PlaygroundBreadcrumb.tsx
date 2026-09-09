"use client";
import type { IconType } from "@trydarwin/ui/icons";
import { BreadcrumbSeparatorIcon, ICONS } from "@trydarwin/ui/icons";
import { Fragment } from "react";

import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { Button } from "@/components/ui/button";
import type { IconPick } from "@/components/ui/IconPicker";
import IconWrapper from "@/components/ui/IconWrapper";
import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useActiveProject } from "@/hooks/useActiveProject";
import { issueIdentifier } from "@/lib/format";
import { cn } from "@/lib/utils";
import { NO_FOCUS, useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useSpaceFormStore } from "@/store/space/useSpaceFormStore";
import type { BoardIssue, BoardSpace } from "@/types/board";

/** Renders any picked icon or emoji — a project's, a space's, a template's. */
function PickedIcon({ pick, className }: { pick: IconPick; className?: string }) {
    if (pick.kind === "emoji") {
        return (
            <IconWrapper
                variant="ghost"
                className={cn("size-4.25 shrink-0 px-0 text-[13px]", className)}
            >
                {pick.char}
            </IconWrapper>
        );
    }
    return (
        <IconWrapper
            icon={ICONS[pick.name as keyof typeof ICONS]}
            iconStyle={{ color: pick.color }}
            variant="solid"
            className={cn("size-6 shrink-0", className)}
            iconClassName="size-4"
        />
    );
}

export type PlaygroundBreadcrumbTarget = {
    tab: PlaygroundTab;
    space?: BoardSpace;
};

export type PlaygroundBreadcrumbSegment =
    | string
    | { label: string; icon?: IconPick | null }
    | { label: string; icon?: IconPick | null; onClick: () => void }
    | { label: string; icon?: IconPick | null; target: PlaygroundBreadcrumbTarget };

export const PROJECT_BREADCRUMB_TARGET: PlaygroundBreadcrumbTarget = {
    tab: PlaygroundTab.Agent,
};

export const SETTINGS_BREADCRUMB_TARGET: PlaygroundBreadcrumbTarget = {
    tab: PlaygroundTab.SettingsOverview,
};

export const SPACES_BREADCRUMB_TARGET: PlaygroundBreadcrumbTarget = {
    tab: PlaygroundTab.Spaces,
};

/**
 * Where an issue's board crumb goes back to: the space it is parked in, or
 * the agent board when it isn't parked anywhere.
 */
export function breadcrumbTargetForIssue(
    space: BoardSpace | undefined,
): PlaygroundBreadcrumbTarget {
    return space ? { tab: PlaygroundTab.Space, space } : { tab: PlaygroundTab.Agent };
}

const TAB_TRAILS: Partial<Record<PlaygroundTab, PlaygroundBreadcrumbSegment[]>> = {
    [PlaygroundTab.Agent]: ["Agent"],
    [PlaygroundTab.Spaces]: ["Spaces"],
    [PlaygroundTab.Gantt]: ["Gantt"],
    [PlaygroundTab.Tags]: ["Tags"],
    [PlaygroundTab.Inbox]: ["Inbox"],
    [PlaygroundTab.Chats]: ["Chats"],
    [PlaygroundTab.AskDarwin]: ["Ask Darwin"],
    [PlaygroundTab.AssignedToMe]: ["My issues"],
    [PlaygroundTab.SettingsOverview]: ["Settings"],
    [PlaygroundTab.SettingsAppearance]: [
        { label: "Settings", target: SETTINGS_BREADCRUMB_TARGET },
        "Appearance",
    ],
    [PlaygroundTab.SettingsApiKeys]: [
        { label: "Settings", target: SETTINGS_BREADCRUMB_TARGET },
        "API keys",
    ],
    [PlaygroundTab.SettingsConnectors]: [
        { label: "Settings", target: SETTINGS_BREADCRUMB_TARGET },
        "Connectors",
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
    [PlaygroundTab.SettingsHarness]: [
        { label: "Settings", target: SETTINGS_BREADCRUMB_TARGET },
        "AI Harness",
    ],
    [PlaygroundTab.SettingsIntegrations]: [
        { label: "Settings", target: SETTINGS_BREADCRUMB_TARGET },
        "Integrations",
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
    const openSpace = usePlaygroundNavStore((state) => state.openSpace);
    const selectedSpace = usePlaygroundNavStore((state) => state.selectedSpace);
    const setFocus = useKanbanOptionsStore((state) => state.setFocus);
    const openSpaceEditor = useSpaceFormStore((state) => state.openEdit);
    const { data: currentProject } = useGetProject(project?.id);
    const canManageSpace =
        currentProject?.viewerRole === "Admin" || currentProject?.viewerRole === "Maintain";
    const inIssue = issue !== undefined;
    // An issue can be opened from Inbox or search, so its space is resolved
    // from the project-wide metadata rather than from whatever pane is showing.
    const issueSpaceId = metadata?.columns.find(
        (column) => column.id === issue?.customColumnId,
    )?.spaceId;
    const issueSpace = metadata?.spaces.find((space) => space.id === issueSpaceId);
    const identifier = issue ? issueIdentifier(project?.name, issue.number) : undefined;
    const issueTrail: PlaygroundBreadcrumbSegment[] = issue
        ? [
              ...(issueSpace ? [{ label: "Spaces", target: SPACES_BREADCRUMB_TARGET }] : []),
              {
                  label: issueSpace?.name ?? "Agent",
                  icon: issueSpace?.icon,
                  target: breadcrumbTargetForIssue(issueSpace),
              },
              trailing
                  ? {
                        label: `${identifier} ${issue.title}`,
                        onClick: () => openIssue(issue.id),
                    }
                  : `${identifier} ${issue.title}`,
              ...(trailing ? [trailing] : []),
          ]
        : [];
    const spaceTrail: PlaygroundBreadcrumbSegment[] = [
        { label: "Spaces", target: SPACES_BREADCRUMB_TARGET },
        {
            label: selectedSpace?.name ?? "Space",
            icon: selectedSpace?.icon,
            ...(canManageSpace && selectedSpace
                ? { onClick: () => openSpaceEditor(selectedSpace.id) }
                : { target: { tab: PlaygroundTab.Space, space: selectedSpace ?? undefined } }),
        },
    ];
    const segments = inIssue
        ? issueTrail
        : (trail ?? (tab === PlaygroundTab.Space ? spaceTrail : (TAB_TRAILS[tab] ?? [])));

    function navigate(target: PlaygroundBreadcrumbTarget) {
        setFocus(NO_FOCUS);
        if (target.space) openSpace(target.space, project?.slug ?? "");
        else setTab(target.tab);
    }

    return (
        <nav className="flex min-w-0 items-center gap-0.5 text-[13px]">
            {!project ? (
                <span className="h-3 w-24 animate-pulse rounded bg-overlay/5" />
            ) : segments.length ? (
                <Button
                    variant="unstyled"
                    type="button"
                    onClick={() => navigate(PROJECT_BREADCRUMB_TARGET)}
                    className="flex min-w-0 cursor-pointer items-center gap-1.5 font-medium capitalize text-neutral-400 transition-colors hover:text-neutral-100"
                >
                    {project.icon && <PickedIcon pick={project.icon} />}
                    <span className="truncate">{project.name}</span>
                </Button>
            ) : (
                <span className="flex min-w-0 items-center gap-1.5 font-medium capitalize text-neutral-200">
                    {project.icon && <PickedIcon pick={project.icon} />}
                    <span className="truncate">{project.name}</span>
                </span>
            )}
            {segments.map((segment, index) => {
                const label = typeof segment === "string" ? segment : segment.label;
                const segmentIcon = typeof segment === "string" ? undefined : segment.icon;
                const onClick =
                    typeof segment === "string"
                        ? undefined
                        : "onClick" in segment
                          ? segment.onClick
                          : "target" in segment
                            ? () => navigate(segment.target)
                            : undefined;
                const current = index === segments.length - 1;

                return (
                    <Fragment key={`${label}-${index}`}>
                        <BreadcrumbSeparatorIcon
                            className="size-3.5 shrink-0 text-neutral-600"
                            aria-hidden
                        />
                        {onClick ? (
                            <Button
                                variant="unstyled"
                                type="button"
                                onClick={onClick}
                                aria-current={current ? "page" : undefined}
                                className={cn(
                                    "flex shrink-0 cursor-pointer items-center gap-1.5 font-medium transition-colors hover:text-neutral-100",
                                    current ? "text-neutral-100" : "text-neutral-400",
                                )}
                            >
                                {segmentIcon && (
                                    <PickedIcon pick={segmentIcon} className="size-5 shrink-0" />
                                )}
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
                                {segmentIcon && (
                                    <PickedIcon pick={segmentIcon} className="size-5 shrink-0" />
                                )}
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
