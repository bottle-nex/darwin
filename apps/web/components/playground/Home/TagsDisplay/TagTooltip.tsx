"use client";

import { TagIcon } from "@trydarwin/ui/icons";
import type { ReactNode } from "react";

import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { IconPickGlyph } from "@/components/ui/IconPicker";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { useIssueView } from "@/hooks/issues/useIssueView";
import { issueFieldKeys } from "@/hooks/shortcuts/issueFieldKeys";
import { useListTags } from "@/hooks/tags/useListTags";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

const AGENT_BOARD_SCOPE = { kind: "agent" } as const;

function TagTooltipFoot({ name }: { name: string }) {
    const project = useActiveProject();
    const { data: tags } = useListTags(project?.id);
    const tag = tags?.find((row) => row.name === name);
    const { setLayout } = useIssueView(AGENT_BOARD_SCOPE);

    function showLabeledIssues() {
        if (!tag) return;
        useKanbanFilterStore.getState().setListFacet("tagIds", [tag.id]);
        usePlaygroundNavStore.getState().setTab(PlaygroundTab.Agent);
        setLayout("list");
    }

    return (
        <>
            {tag ? (
                <button
                    type="button"
                    onClick={showLabeledIssues}
                    className="flex min-w-0 cursor-pointer items-center gap-1.5 text-overlay/50 hover:text-overlay/80"
                >
                    <TagIcon className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate underline decoration-white/20 underline-offset-2">
                        {tag.issueCount} labeled {tag.issueCount === 1 ? "issue" : "issues"}
                    </span>
                </button>
            ) : (
                <span className="flex min-w-0 items-center gap-1.5">
                    <TagIcon className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">Labeled issues</span>
                </span>
            )}
            {project && (
                <span className="flex shrink-0 items-center gap-1.5">
                    {project.icon && (
                        <IconPickGlyph pick={project.icon} className="size-3.5 text-[11px]" />
                    )}
                    <span className="truncate">{project.name}</span>
                </span>
            )}
        </>
    );
}

export default function TagTooltip({
    name,
    color,
    children,
}: {
    name: string;
    color: string;
    children: ReactNode;
}) {
    return (
        <TooltipComponent
            content={
                <span className="flex min-w-0 items-center gap-2">
                    <span
                        style={{ backgroundColor: color }}
                        className="size-2 shrink-0 rounded-full"
                        aria-hidden
                    />
                    <span className="truncate">{name}</span>
                </span>
            }
            foot={<TagTooltipFoot name={name} />}
            shortcut={issueFieldKeys("tags")}
        >
            <span className="inline-flex min-w-0">{children}</span>
        </TooltipComponent>
    );
}
