"use client";
import { Fragment } from "react";
import { motion } from "motion/react";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import { MdChevronRight } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import { useIssueNavigation } from "@/components/playground/Issue/useIssueNavigation";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import type { BoardIssue } from "@/types/board";
import type { BoardView } from "@/types/kanban";

export type PlaygroundBreadcrumbSegment = string | { label: string; onClick: () => void };

const TAB_TRAILS: Partial<Record<PlaygroundTab, PlaygroundBreadcrumbSegment[]>> = {
    [PlaygroundTab.Kanban]: ["Kanban"],
    [PlaygroundTab.Gantt]: ["Gantt"],
    [PlaygroundTab.Tags]: ["Tags"],
    [PlaygroundTab.Inbox]: ["Inbox"],
    [PlaygroundTab.Chats]: ["Chats"],
    [PlaygroundTab.AssignedToMe]: ["My issues"],
    [PlaygroundTab.SettingsAppearance]: ["Settings", "Appearance"],
    [PlaygroundTab.SettingsApiKeys]: ["Settings", "API keys"],
    [PlaygroundTab.SettingsProject]: ["Settings", "General"],
    [PlaygroundTab.SettingsTemplates]: ["Settings", "Issue templates"],
    [PlaygroundTab.SettingsEnv]: ["Settings", "Environment variables"],
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
    issue?: Pick<BoardIssue, "number" | "title" | "customColumnId">;
    trail?: PlaygroundBreadcrumbSegment[];
    trailing?: string;
}) {
    const project = useActiveProject();
    const { close, showIssueDetail } = useIssueNavigation();
    const tab = usePlaygroundNavStore((state) => state.tab) as PlaygroundTab;
    const boardView = useKanbanOptionsStore((state) => state.boardView);
    const inIssue = issue !== undefined;
    const issueIdentifier = issue
        ? `${(project?.name ?? "ISS").slice(0, 3).toUpperCase()}-${issue.number}`
        : undefined;
    const issueTrail: PlaygroundBreadcrumbSegment[] = issue
        ? [
              issue.customColumnId ? "My Board" : "Agent",
              trailing
                  ? { label: `${issueIdentifier} ${issue.title}`, onClick: showIssueDetail }
                  : `${issueIdentifier} ${issue.title}`,
              ...(trailing ? [trailing] : []),
          ]
        : [];
    const kanbanTrail: PlaygroundBreadcrumbSegment[] = [KANBAN_BOARD_LABELS[boardView] ?? "Kanban"];
    const segments = inIssue
        ? issueTrail
        : (trail ?? (tab === PlaygroundTab.Kanban ? kanbanTrail : (TAB_TRAILS[tab] ?? [])));

    return (
        <nav className="flex min-w-0 items-center gap-0.5 text-[13px]">
            {inIssue && (
                <motion.span
                    className="flex shrink-0"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                    <Button
                        variant="unstyled"
                        type="button"
                        aria-label="Back"
                        onClick={close}
                        className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200"
                    >
                        <HiOutlineArrowLeft className="size-3.5" aria-hidden />
                    </Button>
                </motion.span>
            )}
            {!project ? (
                <span className="h-3 w-24 animate-pulse rounded bg-white/5" />
            ) : (
                <span
                    className={cn(
                        "truncate font-medium capitalize",
                        segments.length ? "text-neutral-400" : "text-neutral-200",
                    )}
                >
                    {project.name}
                </span>
            )}
            {segments.map((segment, index) => {
                const label = typeof segment === "string" ? segment : segment.label;
                const onClick = typeof segment === "string" ? undefined : segment.onClick;
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
                                title={label}
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
