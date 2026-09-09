"use client";
import type { DarwinIssueCard } from "@trydarwin/types";

import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import TagDisplay from "@/components/playground/Home/TagsDisplay/TagDisplay";
import { PRIORITY_OPTIONS } from "@/components/playground/Issue/issueHelpers";
import { Button } from "@/components/ui/button";
import { useIssueIdentifier } from "@/hooks/issues/useIssueIdentifier";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import { cn } from "@/lib/utils";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";

const MAX_AVATARS = 3;
const MAX_TAGS = 2;

/**
 * One issue, in the board's own column order: priority, identifier, status, title, tags, people.
 *
 * Every glyph comes from the board rather than a lookalike — `KanbanBoard.glyphFor` for the status,
 * `PRIORITY_OPTIONS` for the priority, `toneFor` for an avatar's colour — so a row here and a row
 * on the board are the same object read twice.
 *
 * `IssueListRow` itself is not reused: it is selection-aware and drag-aware, and neither belongs in
 * an answer.
 */
export default function DarwinIssueRow({ issue }: { issue: DarwinIssueCard }) {
    const identifier = useIssueIdentifier();
    const openIssue = usePaneRouteStore((state) => state.openIssue);

    const glyph = KanbanBoard.glyphFor(issue.status);
    const StatusIcon = glyph.icon;
    const priority = PRIORITY_OPTIONS.find(
        (option) => option.value === KanbanMappers.NUMBER_TO_PRIORITY[issue.priority],
    );
    const PriorityIcon = priority?.icon;
    const overflow = issue.assignees.length - MAX_AVATARS;

    return (
        <Button
            variant="unstyled"
            type="button"
            onClick={() => openIssue(issue.id)}
            title={issue.title}
            className="group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-overlay/5"
        >
            <span className="flex size-4 shrink-0 items-center justify-center">
                {PriorityIcon && (
                    <PriorityIcon
                        className={cn("size-3.5 text-neutral-500", priority?.iconClassName)}
                        aria-hidden
                    />
                )}
            </span>

            <span className="w-14 shrink-0 font-mono text-[11.5px] text-overlay/45">
                {identifier(issue.number)}
            </span>

            <StatusIcon className={cn("size-3.5 shrink-0", glyph.titleBox)} aria-hidden />

            <span className="min-w-0 flex-1 truncate text-[13px] text-overlay group-hover:text-neutral-100">
                {issue.title}
            </span>

            {issue.tags.length > 0 && (
                <span className="hidden shrink-0 items-center gap-1 lg:flex">
                    {issue.tags.slice(0, MAX_TAGS).map((tag) => (
                        <TagDisplay key={tag.id} name={tag.name} color={tag.color} />
                    ))}
                </span>
            )}

            {issue.assignees.length > 0 && (
                <span className="flex shrink-0 -space-x-1">
                    {issue.assignees.slice(0, MAX_AVATARS).map((person) => (
                        <PlaygroundAvatar
                            key={person.id}
                            letter={person.name.charAt(0).toUpperCase()}
                            src={person.image ?? undefined}
                            tone={toneFor(person.id)}
                            size="sm"
                            className="rounded-full ring-1 ring-card"
                        />
                    ))}
                    {overflow > 0 && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-overlay/10 text-[9px] font-medium text-neutral-300 ring-1 ring-inset ring-overlay/15">
                            +{overflow}
                        </span>
                    )}
                </span>
            )}
        </Button>
    );
}
