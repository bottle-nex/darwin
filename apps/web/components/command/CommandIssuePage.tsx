"use client";
import { CheckIcon, KanbanBoardLayoutIcon } from "@trymatcha/ui/icons";

import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import { PRIORITY_TO_NUMBER } from "@/components/playground/Home/KanbanDisplay/customkanban/data";
import { PRIORITY_OPTIONS } from "@/components/playground/Issue/issueHelpers";
import MemberAvatar from "@/components/playground/Issue/MemberAvatar";
import { CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { IconPickGlyph } from "@/components/ui/IconPicker";
import { COPY_FIELDS, DATE_PRESETS, type IssueActions } from "@/hooks/issues/useIssueActions";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";
import type { CommandPage } from "@/types/command.type";

const LIST = "no-scrollbar max-h-[min(60vh,26rem)] p-2";

export const ISSUE_PAGE_TITLE: Record<CommandPage, string> = {
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
    page: CommandPage;
    actions: IssueActions;
    onDone: () => void;
}) {
    const { issue, editable, count } = actions;
    if (!count) return null;

    function pick(run: () => void, closes = true) {
        run();
        if (closes) onDone();
    }

    return (
        <CommandList data-lenis-prevent className={LIST}>
            <CommandEmpty>No matches.</CommandEmpty>

            {page === "status" && (
                <CommandGroup>
                    {KanbanBoard.COLUMNS.map((column) => (
                        <CommandItem
                            key={column.status}
                            value={column.title}
                            disabled={!editable}
                            onSelect={() => pick(() => actions.setStatus(column.status))}
                            className="justify-between px-2.5 py-2"
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
                            className="justify-between px-2.5 py-2"
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
                            value={member.name ?? member.email}
                            disabled={!editable}
                            onSelect={() => pick(() => actions.toggleAssignee(member.id), false)}
                            className="justify-between px-2.5 py-2"
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
                            className="justify-between px-2.5 py-2"
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
                        {DATE_PRESETS.map((preset) => (
                            <CommandItem
                                key={`start-${preset.label}`}
                                value={`start ${preset.label}`}
                                disabled={!editable}
                                onSelect={() => pick(() => actions.setStartDate(preset.days))}
                                className="px-2.5 py-2"
                            >
                                {preset.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandGroup heading="Target date">
                        {DATE_PRESETS.map((preset) => (
                            <CommandItem
                                key={`target-${preset.label}`}
                                value={`target ${preset.label}`}
                                disabled={!editable}
                                onSelect={() => pick(() => actions.setTargetDate(preset.days))}
                                className="px-2.5 py-2"
                            >
                                {preset.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </>
            )}

            {page === "move" && (
                <CommandGroup>
                    {actions.sharedColumnId && (
                        <CommandItem
                            value="Agent board"
                            disabled={!editable}
                            onSelect={() => pick(() => actions.moveToColumn(null))}
                            className="px-2.5 py-2"
                        >
                            <HeroBuddy move={false} className="size-3.5" />
                            Agent board
                        </CommandItem>
                    )}
                    {actions.chapterBoards.map((chapter) =>
                        chapter.columns.length ? (
                            <CommandGroup key={chapter.id} heading={chapter.name}>
                                {chapter.columns
                                    .filter((column) => column.id !== actions.sharedColumnId)
                                    .map((column) => (
                                        <CommandItem
                                            key={column.id}
                                            value={`${chapter.name} ${column.label}`}
                                            disabled={!editable}
                                            onSelect={() =>
                                                pick(() => actions.moveToColumn(column.id))
                                            }
                                            className="px-2.5 py-2"
                                        >
                                            {chapter.icon ? (
                                                <IconPickGlyph
                                                    pick={chapter.icon}
                                                    className="size-3.5"
                                                />
                                            ) : (
                                                <KanbanBoardLayoutIcon
                                                    className="size-3.5"
                                                    aria-hidden
                                                />
                                            )}
                                            <span className="truncate">{column.label}</span>
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        ) : null,
                    )}
                    {actions.chapterBoards.every((chapter) => chapter.columns.length === 0) &&
                        !actions.sharedColumnId && <CommandItem disabled>No columns</CommandItem>}
                </CommandGroup>
            )}

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
                                        field.value(issue, actions.issueHref()),
                                    ),
                                )
                            }
                            className="px-2.5 py-2"
                        >
                            <field.icon className="size-4 text-neutral-400" aria-hidden />
                            Copy {field.label}
                        </CommandItem>
                    ))}
                    <CommandItem
                        value="Duplicate issue"
                        onSelect={() => pick(actions.duplicate)}
                        className="px-2.5 py-2"
                    >
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
