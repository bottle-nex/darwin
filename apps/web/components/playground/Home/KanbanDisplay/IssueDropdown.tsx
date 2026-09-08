"use client";
import {
    AssigneeGroupIcon,
    CalendarIcon,
    CheckIcon,
    CopyIcon,
    DeleteIcon,
    DuplicateIcon,
    ExternalLinkIcon,
    KanbanColumnsIcon,
    SubmenuDisclosureIcon,
    TagIcon,
} from "@trydarwin/ui/icons";
import { type ReactNode, useState } from "react";

import MemberOptionRow from "@/components/playground/Core/components/MemberOptionRow";
import { boardDestinationRows } from "@/components/playground/Issue/boardDestinationRows";
import { PRIORITY_OPTIONS, PRIORITY_TO_NUMBER } from "@/components/playground/Issue/issueHelpers";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useBoardDestinations } from "@/hooks/issues/useBoardDestinations";
import { COPY_FIELDS, useIssueActions } from "@/hooks/issues/useIssueActions";
import { useActiveProject } from "@/hooks/useActiveProject";
import { DATE_SHORTCUTS_WITH_CLEAR } from "@/lib/dateShortcuts";
import { issueHref } from "@/lib/issueHref";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";
import type { BoardIssue } from "@/types/board";

const ICON = "size-3.5 text-snow/50!";

const CHEVRON = "ml-auto size-3.5 text-neutral-500";

/**
 * Radix arms a 100ms hover-intent timer before opening a submenu. On a menu this
 * dense that reads as lag, so the trigger drives the open state itself.
 */
function Submenu({
    trigger,
    className,
    disabled,
    children,
}: {
    trigger: ReactNode;
    className?: string;
    disabled?: boolean;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(false);

    return (
        <ContextMenuSub open={open} onOpenChange={setOpen}>
            <ContextMenuSubTrigger
                disabled={disabled}
                onPointerEnter={() => !disabled && setOpen(true)}
            >
                {trigger}
                <SubmenuDisclosureIcon className={CHEVRON} aria-hidden />
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className={className}>{children}</ContextMenuSubContent>
        </ContextMenuSub>
    );
}

export default function IssueDropdown({
    issueId,
    issue: boardIssue,
    children,
}: {
    issueId: string;
    issue?: BoardIssue;
    children: ReactNode;
}) {
    const actions = useIssueActions(boardIssue ?? issueId);
    const projectName = useActiveProject()?.name;
    const destinations = useBoardDestinations(actions.sharedColumnId);
    const { issue, editable } = actions;

    if (!issue) return <>{children}</>;

    const statusGlyph = KanbanBoard.glyphFor(issue.status);
    const priorityOption = PRIORITY_OPTIONS.find(
        (option) => PRIORITY_TO_NUMBER[option.value] === issue.priority,
    );
    const StatusIcon = statusGlyph.icon;
    const PriorityIcon = priorityOption?.icon ?? PRIORITY_OPTIONS[0].icon;

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-50">
                <ContextMenuItem onSelect={actions.openInNewTab}>
                    <ExternalLinkIcon className={ICON} aria-hidden />
                    <span className="flex-1">Open in new tab</span>
                </ContextMenuItem>

                <ContextMenuSeparator />

                <Submenu
                    disabled={actions.statusOptions.length === 0}
                    className="w-44"
                    trigger={
                        <>
                            <StatusIcon
                                className={cn("size-3.5", statusGlyph.titleBox)}
                                aria-hidden
                            />
                            <span className="flex-1">Status</span>
                        </>
                    }
                >
                    {actions.statusOptions.map((column) => (
                        <ContextMenuItem
                            key={column.status}
                            onSelect={() => actions.setStatus(column.status)}
                        >
                            <column.icon className={cn("size-3.5", column.titleBox)} aria-hidden />
                            <span className="flex-1">{column.title}</span>
                            {issue.status === column.status && (
                                <CheckIcon className="size-3.5 text-neutral-300" aria-hidden />
                            )}
                        </ContextMenuItem>
                    ))}
                </Submenu>

                <Submenu
                    disabled={!editable}
                    className="w-44"
                    trigger={
                        <>
                            <PriorityIcon
                                className={cn(
                                    "size-3.5 text-neutral-400",
                                    priorityOption?.iconClassName,
                                )}
                                aria-hidden
                            />
                            <span className="flex-1">Priority</span>
                        </>
                    }
                >
                    {PRIORITY_OPTIONS.map((option) => (
                        <ContextMenuItem
                            key={option.value}
                            onSelect={() => actions.setPriority(option.value)}
                        >
                            <option.icon
                                className={cn("size-3.5 text-neutral-400", option.iconClassName)}
                                aria-hidden
                            />
                            <span className="flex-1">{option.label}</span>
                            {issue.priority === PRIORITY_TO_NUMBER[option.value] && (
                                <CheckIcon className="size-3.5 text-neutral-300" aria-hidden />
                            )}
                        </ContextMenuItem>
                    ))}
                </Submenu>

                <Submenu
                    disabled={!editable}
                    className="w-52"
                    trigger={
                        <>
                            <AssigneeGroupIcon className={ICON} aria-hidden />
                            <span className="flex-1">Assignees</span>
                        </>
                    }
                >
                    {actions.members.map((member) => (
                        <ContextMenuItem
                            key={member.id}
                            onSelect={(event) => {
                                event.preventDefault();
                                actions.toggleAssignee(member.id);
                            }}
                        >
                            <MemberOptionRow
                                id={member.id}
                                label={member.name ?? member.email}
                                avatarSrc={member.image}
                                checked={actions.assigneeIds.has(member.id)}
                            />
                        </ContextMenuItem>
                    ))}
                    {actions.members.length === 0 && (
                        <ContextMenuItem disabled>No members</ContextMenuItem>
                    )}
                </Submenu>

                <Submenu
                    disabled={!editable}
                    className="w-52"
                    trigger={
                        <>
                            <TagIcon className={ICON} aria-hidden />
                            <span className="flex-1">Tags</span>
                        </>
                    }
                >
                    {actions.tags.map((tag) => (
                        <ContextMenuItem
                            key={tag.id}
                            onSelect={(event) => {
                                event.preventDefault();
                                actions.toggleTag(tag.id);
                            }}
                        >
                            <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: tag.color }}
                                aria-hidden
                            />
                            <span className="flex-1 truncate">{tag.name}</span>
                            {actions.tagIds.has(tag.id) && (
                                <CheckIcon className="size-3.5 text-neutral-300" aria-hidden />
                            )}
                        </ContextMenuItem>
                    ))}
                    {actions.tags.length === 0 && (
                        <ContextMenuItem disabled>No tags</ContextMenuItem>
                    )}
                </Submenu>

                <Submenu
                    disabled={!editable}
                    className="w-40"
                    trigger={
                        <>
                            <CalendarIcon className={ICON} aria-hidden />
                            <span className="flex-1">Start date</span>
                        </>
                    }
                >
                    {DATE_SHORTCUTS_WITH_CLEAR.map((shortcut) => (
                        <ContextMenuItem
                            key={shortcut.label}
                            onSelect={() => actions.setStartDate(shortcut.resolve())}
                        >
                            <span className="flex-1">{shortcut.label}</span>
                        </ContextMenuItem>
                    ))}
                </Submenu>

                <Submenu
                    disabled={!editable}
                    className="w-40"
                    trigger={
                        <>
                            <CalendarIcon className={ICON} aria-hidden />
                            <span className="flex-1">Target date</span>
                        </>
                    }
                >
                    {DATE_SHORTCUTS_WITH_CLEAR.map((shortcut) => (
                        <ContextMenuItem
                            key={shortcut.label}
                            onSelect={() => actions.setTargetDate(shortcut.resolve())}
                        >
                            <span className="flex-1">{shortcut.label}</span>
                        </ContextMenuItem>
                    ))}
                </Submenu>

                <ContextMenuSeparator />

                <Submenu
                    disabled={!actions.canEdit("move")}
                    className="w-52"
                    trigger={
                        <>
                            <KanbanColumnsIcon className={ICON} aria-hidden />
                            <span className="flex-1">Move to</span>
                        </>
                    }
                >
                    {boardDestinationRows({
                        destinations,
                        disabled: !actions.canEdit("move"),
                        onPick: (columnId) => actions.moveToColumn(columnId),
                        Item: ({ disabled, onSelect, className, children }) => (
                            <ContextMenuItem
                                disabled={disabled}
                                onSelect={onSelect}
                                className={className}
                            >
                                {children}
                            </ContextMenuItem>
                        ),
                        Heading: ({ icon, name, children }) => (
                            <>
                                <ContextMenuLabel className="flex items-center gap-1.5">
                                    {icon}
                                    <span className="truncate">{name}</span>
                                </ContextMenuLabel>
                                {children}
                            </>
                        ),
                    })}
                </Submenu>

                <Submenu
                    className="w-60"
                    trigger={
                        <>
                            <CopyIcon className={ICON} aria-hidden />
                            <span className="flex-1">Copy</span>
                        </>
                    }
                >
                    {COPY_FIELDS.map((field) => (
                        <ContextMenuItem
                            key={field.label}
                            onSelect={() =>
                                actions.copyField(
                                    field.label,
                                    field.value(issue, issueHref(issue.id), projectName),
                                )
                            }
                        >
                            <field.icon className={ICON} aria-hidden />
                            <span className="flex-1 whitespace-nowrap">Copy {field.label}</span>
                        </ContextMenuItem>
                    ))}
                    <ContextMenuSeparator />
                    <ContextMenuItem onSelect={actions.duplicate}>
                        <DuplicateIcon className={ICON} aria-hidden />
                        <span className="flex-1 whitespace-nowrap">Duplicate issue</span>
                    </ContextMenuItem>
                </Submenu>

                <ContextMenuItem variant="destructive" onSelect={actions.requestDelete}>
                    <DeleteIcon className="size-3.5" aria-hidden />
                    <span className="flex-1">Delete</span>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
