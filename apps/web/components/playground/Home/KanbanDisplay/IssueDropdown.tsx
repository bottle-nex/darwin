"use client";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { IconType } from "react-icons";
import { isAxiosError } from "axios";
import TurndownService from "turndown";
import { MdCheck } from "react-icons/md";
import {
    LuChevronRight,
    LuCalendar,
    LuColumns3,
    LuCopy,
    LuExternalLink,
    LuFingerprint,
    LuHash,
    LuLink,
    LuSquareArrowOutUpRight,
    LuType,
    LuTag,
    LuTrash2,
    LuUsers,
} from "react-icons/lu";
import { TbFileInvoiceFilled } from "react-icons/tb";
import { Button } from "@/components/ui/button";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { PRIORITY_TO_NUMBER } from "./customkanban/data";
import { PRIORITY_OPTIONS, isEditable } from "@/components/playground/Issue/issueHelpers";
import { useIssueRoute } from "@/components/playground/Issue/useIssueRoute";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useUpdateIssue } from "@/hooks/issues/useUpdateIssue";
import { useDeleteIssue } from "@/hooks/issues/useDeleteIssue";
import { useAssignIssue, useUnassignIssue } from "@/hooks/issues/useAssignIssue";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { useListTags } from "@/hooks/tags/useListTags";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { KanbanStatus } from "@/types/kanban";
import type { BoardIssue } from "@/types/board";

const ICON = "size-3.5 text-neutral-400";

const CHEVRON = "ml-auto size-3.5 text-neutral-500";

const DATE_PRESETS: { label: string; days: number | null }[] = [
    { label: "Today", days: 0 },
    { label: "Tomorrow", days: 1 },
    { label: "Next week", days: 7 },
    { label: "Clear", days: null },
];

const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });

const COPY_FIELDS: {
    label: string;
    icon: IconType;
    value: (issue: BoardIssue, url: string) => string;
}[] = [
    { label: "URL", icon: LuLink, value: (_issue, url) => url },
    { label: "title", icon: LuType, value: (issue) => issue.title },
    { label: "issue number", icon: LuHash, value: (issue) => `#${issue.number}` },
    { label: "issue ID", icon: LuFingerprint, value: (issue) => issue.id },
    {
        label: "description as markdown",
        icon: TbFileInvoiceFilled,
        value: (issue) => turndown.turndown(issue.description ?? ""),
    },
];

function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}.`);
}

function presetToIso(days: number | null): string | null {
    if (days === null) return null;
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(12, 0, 0, 0);
    return date.toISOString();
}

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
                <LuChevronRight className={CHEVRON} aria-hidden />
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
    const project = useActiveProject();
    const projectId = project?.id;
    const { data: board } = useBoard(projectId);
    const issue = board?.issues.find((row) => row.id === issueId);

    const { openIssue } = useIssueRoute();
    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const columns = useFilteredCustomColumns();
    const { data: members } = useProjectMembers(projectId);
    const { data: tags } = useListTags(projectId);

    const updateIssue = useUpdateIssue();
    const deleteIssue = useDeleteIssue();
    const assignIssue = useAssignIssue();
    const unassignIssue = useUnassignIssue();

    const [confirmOpen, setConfirmOpen] = useState(false);

    if (!issue || !projectId) return <>{children}</>;

    const editable = isEditable(issue);
    const statusColumn = KanbanBoard.COLUMNS.find((column) => column.status === issue.status);
    const priorityOption = PRIORITY_OPTIONS.find(
        (option) => PRIORITY_TO_NUMBER[option.value] === issue.priority,
    );
    const StatusIcon = statusColumn?.icon ?? KanbanBoard.COLUMNS[0].icon;
    const PriorityIcon = priorityOption?.icon ?? PRIORITY_OPTIONS[0].icon;
    const assigneeIds = new Set(issue.assignees.map((member) => member.id));
    const tagIds = new Set(issue.tags.map((tag) => tag.id));

    function patch(input: Parameters<typeof updateIssue.mutate>[0]) {
        updateIssue.mutate(input, {
            onError: () => toast.error("Couldn't update the issue."),
        });
    }

    function open() {
        if (issue!.status === KanbanStatus.InReview) {
            setTab(PlaygroundTab.Reviews);
            return;
        }
        openIssue(issue!.id);
    }

    function issueHref() {
        const base = window.location.pathname.replace(/\/issue\/[^/]+\/?$/, "");
        return `${window.location.origin}${base}/issue/${issue!.id}`;
    }

    function toggleAssignee(userId: string) {
        const mutation = assigneeIds.has(userId) ? unassignIssue : assignIssue;
        mutation.mutate(
            { id: issue!.id, project_id: projectId!, user_id: userId },
            {
                onError: (error) => {
                    const denied =
                        isAxiosError(error) &&
                        error.response?.data?.error?.code === "PICK_NOT_ALLOWED";
                    toast.error(
                        denied
                            ? "You can only pick up an issue that's still to do."
                            : "Couldn't change the assignees.",
                    );
                },
            },
        );
    }

    function toggleTag(tagId: string) {
        const next = tagIds.has(tagId)
            ? [...tagIds].filter((id) => id !== tagId)
            : [...tagIds, tagId];
        patch({ id: issue!.id, project_id: projectId!, tag_ids: next });
    }

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
                <ContextMenuContent className="w-52">
                    <ContextMenuItem onSelect={open}>
                        <LuExternalLink className={ICON} aria-hidden />
                        <span className="flex-1">Open</span>
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => window.open(issueHref(), "_blank")}>
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
                                    className={cn("size-3.5", statusColumn?.titleBox)}
                                    aria-hidden
                                />
                                <span className="flex-1">Status</span>
                            </>
                        }
                    >
                        {KanbanBoard.COLUMNS.map((column) => (
                            <ContextMenuItem
                                key={column.status}
                                onSelect={() =>
                                    patch({
                                        id: issue.id,
                                        project_id: projectId,
                                        status: column.status,
                                        custom_column_id: null,
                                    })
                                }
                            >
                                <column.icon
                                    className={cn("size-3.5", column.titleBox)}
                                    aria-hidden
                                />
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
                                onSelect={() =>
                                    patch({
                                        id: issue.id,
                                        project_id: projectId,
                                        priority: PRIORITY_TO_NUMBER[option.value],
                                    })
                                }
                            >
                                <option.icon
                                    className={cn(
                                        "size-3.5 text-neutral-400",
                                        option.iconClassName,
                                    )}
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
                        {(members ?? []).map((member) => (
                            <ContextMenuItem
                                key={member.id}
                                onSelect={(event) => {
                                    event.preventDefault();
                                    toggleAssignee(member.id);
                                }}
                            >
                                <span className="flex-1 truncate">
                                    {member.name ?? member.email}
                                </span>
                                {assigneeIds.has(member.id) && (
                                    <MdCheck className="size-3.5 text-neutral-300" aria-hidden />
                                )}
                            </ContextMenuItem>
                        ))}
                        {(members ?? []).length === 0 && (
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
                        {(tags ?? []).map((tag) => (
                            <ContextMenuItem
                                key={tag.id}
                                onSelect={(event) => {
                                    event.preventDefault();
                                    toggleTag(tag.id);
                                }}
                            >
                                <span
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: tag.color }}
                                    aria-hidden
                                />
                                <span className="flex-1 truncate">{tag.name}</span>
                                {tagIds.has(tag.id) && (
                                    <MdCheck className="size-3.5 text-neutral-300" aria-hidden />
                                )}
                            </ContextMenuItem>
                        ))}
                        {(tags ?? []).length === 0 && (
                            <ContextMenuItem disabled>No tags</ContextMenuItem>
                        )}
                    </Submenu>

                    <Submenu
                        disabled={!editable}
                        className="w-40"
                        trigger={
                            <>
                                <LuCalendar className={ICON} aria-hidden />
                                <span className="flex-1">Start date</span>
                            </>
                        }
                    >
                        {DATE_PRESETS.map((preset) => (
                            <ContextMenuItem
                                key={preset.label}
                                onSelect={() =>
                                    patch({
                                        id: issue.id,
                                        project_id: projectId,
                                        start_date: presetToIso(preset.days),
                                    })
                                }
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
                                <LuCalendar className={ICON} aria-hidden />
                                <span className="flex-1">Target date</span>
                            </>
                        }
                    >
                        {DATE_PRESETS.map((preset) => (
                            <ContextMenuItem
                                key={preset.label}
                                onSelect={() =>
                                    patch({
                                        id: issue.id,
                                        project_id: projectId,
                                        target_date: presetToIso(preset.days),
                                    })
                                }
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
                            <ContextMenuItem
                                onSelect={() =>
                                    patch({
                                        id: issue.id,
                                        project_id: projectId,
                                        custom_column_id: null,
                                    })
                                }
                            >
                                <span className="flex-1">Back to board</span>
                            </ContextMenuItem>
                        )}
                        {columns
                            .filter((column) => column.id !== issue.customColumnId)
                            .map((column) => (
                                <ContextMenuItem
                                    key={column.id}
                                    onSelect={() =>
                                        patch({
                                            id: issue.id,
                                            project_id: projectId,
                                            custom_column_id: column.id,
                                        })
                                    }
                                >
                                    <span className="flex-1 truncate">{column.title}</span>
                                </ContextMenuItem>
                            ))}
                        {columns.length === 0 && !issue.customColumnId && (
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
                                onSelect={() => copy(field.value(issue, issueHref()), field.label)}
                            >
                                <field.icon className={ICON} aria-hidden />
                                <span className="flex-1 whitespace-nowrap">Copy {field.label}</span>
                            </ContextMenuItem>
                        ))}
                    </Submenu>

                    <ContextMenuItem
                        variant="destructive"
                        disabled={!editable}
                        onSelect={() => setConfirmOpen(true)}
                    >
                        <LuTrash2 className="size-3.5" aria-hidden />
                        <span className="flex-1">Delete</span>
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="bg-charcoal sm:max-w-105">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-100">Delete issue</DialogTitle>
                        <DialogDescription className="text-neutral-500">
                            This permanently deletes &ldquo;{issue.title}&rdquo;. You can&apos;t
                            undo this.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="tertiary"
                            onClick={() => setConfirmOpen(false)}
                            disabled={deleteIssue.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            loading={deleteIssue.isPending}
                            onClick={() =>
                                deleteIssue.mutate(
                                    { id: issue.id, project_id: projectId },
                                    {
                                        onSuccess: () => setConfirmOpen(false),
                                        onError: () => toast.error("Couldn't delete the issue."),
                                    },
                                )
                            }
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
