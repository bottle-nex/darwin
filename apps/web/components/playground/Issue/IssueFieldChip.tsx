"use client";
import { type ReactNode, useState } from "react";

import CommandIssuePage, { ISSUE_PAGE_TITLE } from "@/components/command/CommandIssuePage";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIssueActions } from "@/hooks/issues/useIssueActions";
import { cn } from "@/lib/utils";
import type { BoardIssue } from "@/types/board";
import type { IssueCommandPage } from "@/types/command.type";

/** The fields worth searching through; the rest are short enough to scan. */
const SEARCHABLE: IssueCommandPage[] = ["assignees", "tags", "move"];

/**
 * The options themselves. Lives inside `PopoverContent`, which Radix unmounts while
 * closed — so `useIssueActions` and its dozen subscriptions run only for the one
 * chip that is open, rather than once per glyph on screen.
 */
function IssueFieldMenu({
    issueId,
    issue,
    field,
    onDone,
}: {
    issueId: string;
    issue?: BoardIssue;
    field: IssueCommandPage;
    onDone: () => void;
}) {
    const actions = useIssueActions(issue ?? issueId);

    return (
        <Command>
            {SEARCHABLE.includes(field) && (
                <CommandInput placeholder={`${ISSUE_PAGE_TITLE[field]}...`} />
            )}
            {actions.count ? (
                <CommandIssuePage page={field} actions={actions} onDone={onDone} />
            ) : (
                <CommandList>
                    <CommandItem disabled>Loading…</CommandItem>
                </CommandList>
            )}
        </Command>
    );
}

/**
 * Turns any field glyph into its own editor. The trigger holds no issue data, so it
 * always opens; whether a field can actually change is decided by the options inside.
 */
export default function IssueFieldChip({
    issueId,
    issue,
    field,
    disabled,
    className,
    contentClassName,
    children,
}: {
    issueId: string;
    issue?: BoardIssue;
    field: IssueCommandPage;
    contentClassName?: string;
    /** For surfaces that are read-only regardless of the issue, e.g. the review pane. */
    disabled?: boolean;
    className?: string;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(false);

    if (disabled) return <>{children}</>;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label={ISSUE_PAGE_TITLE[field]}
                    data-row-editor
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                    className={className ?? "cursor-pointer"}
                >
                    {children}
                </button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-56 p-0", contentClassName)}>
                <IssueFieldMenu
                    issueId={issueId}
                    issue={issue}
                    field={field}
                    onDone={() => setOpen(false)}
                />
            </PopoverContent>
        </Popover>
    );
}
