"use client";
import { useState, type ReactNode } from "react";
import { MdCheck } from "react-icons/md";
import {
    LuColumns3,
    LuCopy,
    LuCopyPlus,
    LuSquareArrowOutUpRight,
    LuTag,
    LuTrash2,
    LuUsers,
} from "react-icons/lu";
import { RxTriangleRight } from "react-icons/rx";
import { HiCalendar } from "react-icons/hi2";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { PRIORITY_TO_NUMBER } from "./customkanban/data";
import { PRIORITY_OPTIONS } from "@/components/playground/Issue/issueHelpers";
import { COPY_FIELDS, DATE_PRESETS, useIssueActions } from "@/hooks/issues/useIssueActions";

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
                <RxTriangleRight className={CHEVRON} aria-hidden />
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className={className}>{children}</ContextMenuSubContent>
        </ContextMenuSub>
    );
}

export default function IssueDropdown({
    issueId,
    children,
}: {
    issueId: string;
    children: ReactNode;
}) {
    const actions = useIssueActions(issueId);
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
                    <LuSquareArrowOutUpRight className={ICON} aria-hidden />
                    <span className="flex-1">Open in new tab</span>
                </ContextMenuItem>

                <ContextMenuSeparator />

                <Submenu
                    disabled={!editable}
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
                    {KanbanBoard.COLUMNS.map((column) => (
                        <ContextMenuItem
                            key={column.status}
                            onSelect={() => actions.setStatus(column.status)}
                        >
                            <column.icon className={cn("size-3.5", column.titleBox)} aria-hidden />
                            <span className="flex-1">{column.title}</span>
                            {issue.status === column.status && (
                                <MdCheck className="size-3.5 text-neutral-300" aria-hidden />
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
                                <MdCheck className="size-3.5 text-neutral-300" aria-hidden />
                            )}
                        </ContextMenuItem>
                    ))}
                </Submenu>

                <Submenu
                    disabled={!editable}
                    className="w-52"
                    trigger={
                        <>
                            <LuUsers className={ICON} aria-hidden />
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
                            <span className="flex-1 truncate">{member.name ?? member.email}</span>
                            {actions.assigneeIds.has(member.id) && (
                                <MdCheck className="size-3.5 text-neutral-300" aria-hidden />
                            )}
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
                            <LuTag className={ICON} aria-hidden />
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
                                <MdCheck className="size-3.5 text-neutral-300" aria-hidden />
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
                            <HiCalendar className={ICON} aria-hidden />
                            <span className="flex-1">Start date</span>
                        </>
                    }
                >
                    {DATE_PRESETS.map((preset) => (
                        <ContextMenuItem
                            key={preset.label}
                            onSelect={() => actions.setStartDate(preset.days)}
                        >
                            <span className="flex-1">{preset.label}</span>
                        </ContextMenuItem>
                    ))}
                </Submenu>

                <Submenu
                    disabled={!editable}
                    className="w-40"
                    trigger={
                        <>
                            <HiCalendar className={ICON} aria-hidden />
                            <span className="flex-1">Target date</span>
                        </>
                    }
                >
                    {DATE_PRESETS.map((preset) => (
                        <ContextMenuItem
                            key={preset.label}
                            onSelect={() => actions.setTargetDate(preset.days)}
                        >
                            <span className="flex-1">{preset.label}</span>
                        </ContextMenuItem>
                    ))}
                </Submenu>

                <ContextMenuSeparator />

                <Submenu
                    disabled={!editable}
                    className="w-52"
                    trigger={
                        <>
                            <LuColumns3 className={ICON} aria-hidden />
                            <span className="flex-1">Move to</span>
                        </>
                    }
                >
                    {issue.customColumnId && (
                        <ContextMenuItem onSelect={() => actions.moveToColumn(null)}>
                            <span className="flex-1">Back to board</span>
                        </ContextMenuItem>
                    )}
                    {actions.columns
                        .filter((column) => column.id !== issue.customColumnId)
                        .map((column) => (
                            <ContextMenuItem
                                key={column.id}
                                onSelect={() => actions.moveToColumn(column.id)}
                            >
                                <span className="flex-1 truncate">{column.title}</span>
                            </ContextMenuItem>
                        ))}
                    {actions.columns.length === 0 && !issue.customColumnId && (
                        <ContextMenuItem disabled>No columns</ContextMenuItem>
                    )}
                </Submenu>

                <Submenu
                    className="w-60"
                    trigger={
                        <>
                            <LuCopy className={ICON} aria-hidden />
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
                                    field.value(issue, actions.issueHref()),
                                )
                            }
                        >
                            <field.icon className={ICON} aria-hidden />
                            <span className="flex-1 whitespace-nowrap">Copy {field.label}</span>
                        </ContextMenuItem>
                    ))}
                    <ContextMenuSeparator />
                    <ContextMenuItem onSelect={actions.duplicate}>
                        <LuCopyPlus className={ICON} aria-hidden />
                        <span className="flex-1 whitespace-nowrap">Duplicate issue</span>
                    </ContextMenuItem>
                </Submenu>

                <ContextMenuItem
                    variant="destructive"
                    disabled={!editable}
                    onSelect={actions.requestDelete}
                >
                    <LuTrash2 className="size-3.5" aria-hidden />
                    <span className="flex-1">Delete</span>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
