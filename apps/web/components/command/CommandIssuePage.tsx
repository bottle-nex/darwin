"use client";
import { CheckIcon } from "@trymatcha/ui/icons";

import { PRIORITY_TO_NUMBER } from "@/components/playground/Home/KanbanDisplay/customkanban/data";
import { boardDestinationRows } from "@/components/playground/Issue/boardDestinationRows";
import { PRIORITY_OPTIONS } from "@/components/playground/Issue/issueHelpers";
import MemberAvatar from "@/components/playground/Issue/MemberAvatar";
import { CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { useBoardDestinations } from "@/hooks/issues/useBoardDestinations";
import { COPY_FIELDS, type IssueActions } from "@/hooks/issues/useIssueActions";
import { useActiveProject } from "@/hooks/useActiveProject";
import { DATE_SHORTCUTS_WITH_CLEAR } from "@/lib/dateShortcuts";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";
import type { IssueCommandPage } from "@/types/command.type";

export const ISSUE_PAGE_TITLE: Record<IssueCommandPage, string> = {
    status: "Change status",
    priority: "Set priority",
    assignees: "Assign to",
    tags: "Edit tags",
    dates: "Set dates",
    move: "Move to column",
    copy: "Copy from issue",
};

export default function CommandIssuePage({
    page,
    actions,
    onDone,
}: {
    page: IssueCommandPage;
    actions: IssueActions;
    onDone: () => void;
}) {
    const { issue, count } = actions;
    // Each page is one field, so its rows share one rule.
    const editable = actions.canEdit(page);
    const destinations = useBoardDestinations(actions.sharedColumnId);
    const projectName = useActiveProject()?.name;
    if (!count) return null;

    function pick(run: () => void, closes = true) {
        run();
        if (closes) onDone();
    }

    return (
        <CommandList data-lenis-prevent>
            <CommandEmpty>No matches.</CommandEmpty>

            {page === "status" && (
                <CommandGroup>
                    {KanbanBoard.COLUMNS.map((column) => (
                        <CommandItem
                            key={column.status}
                            value={column.title}
                            disabled={!editable}
                            onSelect={() => pick(() => actions.setStatus(column.status))}
                            className="justify-between"
                        >
                            <span className="flex items-center gap-2.5">
                                <column.icon
                                    className={cn("size-4", column.titleBox)}
                                    aria-hidden
                                />
                                {column.title}
                            </span>
                            {actions.sharedStatus === column.status && <Tick />}
                        </CommandItem>
                    ))}
                </CommandGroup>
            )}

            {page === "priority" && (
                <CommandGroup>
                    {PRIORITY_OPTIONS.map((option) => (
                        <CommandItem
                            key={option.value}
                            value={option.label}
                            disabled={!editable}
                            onSelect={() => pick(() => actions.setPriority(option.value))}
                            className="justify-between"
                        >
                            <span className="flex items-center gap-2.5">
                                <option.icon
                                    className={cn("size-4 text-neutral-400", option.iconClassName)}
                                    aria-hidden
                                />
                                {option.label}
                            </span>
                            {actions.sharedPriority === PRIORITY_TO_NUMBER[option.value] && (
                                <Tick />
                            )}
                        </CommandItem>
                    ))}
                </CommandGroup>
            )}

            {page === "assignees" && (
                <CommandGroup>
                    {actions.members.map((member) => (
                        <CommandItem
                            key={member.id}
                            value={`${member.name ?? ""} ${member.email}`}
                            disabled={!editable}
                            onSelect={() => pick(() => actions.toggleAssignee(member.id), false)}
                            className="justify-between"
                        >
                            <span className="flex min-w-0 items-center gap-2.5">
                                <MemberAvatar member={member} className="size-5" />
                                <span className="truncate">{member.name ?? member.email}</span>
                            </span>
                            {actions.assigneeIds.has(member.id) && <Tick />}
                        </CommandItem>
                    ))}
                    {actions.members.length === 0 && <CommandItem disabled>No members</CommandItem>}
                </CommandGroup>
            )}

            {page === "tags" && (
                <CommandGroup>
                    {actions.tags.map((tag) => (
                        <CommandItem
                            key={tag.id}
                            value={tag.name}
                            disabled={!editable}
                            onSelect={() => pick(() => actions.toggleTag(tag.id), false)}
                            className="justify-between"
                        >
                            <span className="flex min-w-0 items-center gap-2.5">
                                <span
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: tag.color }}
                                    aria-hidden
                                />
                                <span className="truncate">{tag.name}</span>
                            </span>
                            {actions.tagIds.has(tag.id) && <Tick />}
                        </CommandItem>
                    ))}
                    {actions.tags.length === 0 && <CommandItem disabled>No tags</CommandItem>}
                </CommandGroup>
            )}

            {page === "dates" && (
                <>
                    <CommandGroup heading="Start date">
                        {DATE_SHORTCUTS_WITH_CLEAR.map((shortcut) => (
                            <CommandItem
                                key={`start-${shortcut.label}`}
                                value={`start ${shortcut.label}`}
                                disabled={!editable}
                                onSelect={() =>
                                    pick(() => actions.setStartDate(shortcut.resolve()))
                                }
                            >
                                {shortcut.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandGroup heading="Target date">
                        {DATE_SHORTCUTS_WITH_CLEAR.map((shortcut) => (
                            <CommandItem
                                key={`target-${shortcut.label}`}
                                value={`target ${shortcut.label}`}
                                disabled={!editable}
                                onSelect={() =>
                                    pick(() => actions.setTargetDate(shortcut.resolve()))
                                }
                            >
                                {shortcut.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </>
            )}

            {page === "move" &&
                boardDestinationRows({
                    destinations,
                    disabled: !editable,
                    onPick: (columnId) => pick(() => actions.moveToColumn(columnId)),
                    Item: ({ disabled, onSelect, className, children }) => (
                        <CommandItem disabled={disabled} onSelect={onSelect} className={className}>
                            {children}
                        </CommandItem>
                    ),
                    Heading: ({ icon, name, children }) => (
                        <CommandGroup
                            heading={
                                <span className="flex items-center gap-1.5">
                                    {icon}
                                    <span className="truncate">{name}</span>
                                </span>
                            }
                        >
                            {children}
                        </CommandGroup>
                    ),
                })}

            {page === "copy" && issue && (
                <CommandGroup>
                    {COPY_FIELDS.map((field) => (
                        <CommandItem
                            key={field.label}
                            value={`copy ${field.label}`}
                            onSelect={() =>
                                pick(() =>
                                    actions.copyField(
                                        field.label,
                                        field.value(issue, actions.issueHref(), projectName),
                                    ),
                                )
                            }
                        >
                            <field.icon className="size-4 text-neutral-400" aria-hidden />
                            Copy {field.label}
                        </CommandItem>
                    ))}
                    <CommandItem value="Duplicate issue" onSelect={() => pick(actions.duplicate)}>
                        Duplicate issue
                    </CommandItem>
                </CommandGroup>
            )}
        </CommandList>
    );
}

function Tick() {
    return <CheckIcon className="size-3.5 shrink-0 text-neutral-300" aria-hidden />;
}
