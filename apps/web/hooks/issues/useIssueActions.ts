"use client";
import { toast } from "@/lib/toast";
import { isAxiosError } from "axios";
import TurndownService from "turndown";
import type { IconType } from "react-icons";
import { LuFingerprint, LuHash, LuLink, LuType } from "react-icons/lu";
import { TbFileInvoiceFilled } from "react-icons/tb";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useCreateIssue, type CreateIssueInput } from "@/hooks/issues/useCreateIssue";
import { useUpdateIssue, type UpdateIssueInput } from "@/hooks/issues/useUpdateIssue";
import { useAssignIssue, useUnassignIssue } from "@/hooks/issues/useAssignIssue";
import { useFilteredCustomColumns } from "@/hooks/kanban/useFilteredCustomColumns";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { useListTags } from "@/hooks/tags/useListTags";
import { useDeleteIssueStore } from "@/store/issues/useDeleteIssueStore";
import { isEditable } from "@/components/playground/Issue/issueHelpers";
import { PRIORITY_TO_NUMBER } from "@/components/playground/Home/KanbanDisplay/customkanban/data";
import type { Priority } from "@/types/kanban";
import type { BoardIssue, ServerIssueStatus } from "@/types/board";

export const DATE_PRESETS: { label: string; days: number | null }[] = [
    { label: "Today", days: 0 },
    { label: "Tomorrow", days: 1 },
    { label: "Next week", days: 7 },
    { label: "Clear", days: null },
];

const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });

export const COPY_FIELDS: {
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

function presetToIso(days: number | null): string | null {
    if (days === null) return null;
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(12, 0, 0, 0);
    return date.toISOString();
}

export type IssueActions = ReturnType<typeof useIssueActions>;

/**
 * Every mutation the product offers on a single issue, in one place, so the
 * context menu and the command menu drive an issue through the same handlers.
 */
export function useIssueActions(issueId: string | null | undefined) {
    const projectId = useActiveProject()?.id;
    const { data: board } = useBoard(projectId);
    const issue = issueId ? board?.issues.find((row) => row.id === issueId) : undefined;

    const columns = useFilteredCustomColumns();
    const { data: members } = useProjectMembers(projectId);
    const { data: tags } = useListTags(projectId);

    const updateIssue = useUpdateIssue();
    const createIssue = useCreateIssue();
    const assignIssue = useAssignIssue();
    const unassignIssue = useUnassignIssue();
    const requestDelete = useDeleteIssueStore((s) => s.requestDelete);

    const ready = Boolean(issue && projectId);
    const editable = Boolean(issue && isEditable(issue));
    const assigneeIds = new Set(issue?.assignees.map((member) => member.id) ?? []);
    const tagIds = new Set(issue?.tags.map((tag) => tag.id) ?? []);

    function patch(input: Omit<UpdateIssueInput, "id" | "project_id">) {
        if (!ready) return;
        updateIssue.mutate(
            { id: issue!.id, project_id: projectId!, ...input },
            { onError: () => toast.error("Couldn't update the issue.") },
        );
    }

    function issueHref(): string {
        const base = window.location.pathname.replace(/\/issue\/[^/]+\/?$/, "");
        return `${window.location.origin}${base}/issue/${issue?.id}`;
    }

    return {
        issue,
        projectId,
        columns,
        members: members ?? [],
        tags: tags ?? [],
        editable,
        assigneeIds,
        tagIds,
        issueHref,

        setStatus: (status: ServerIssueStatus) => patch({ status, custom_column_id: null }),
        setPriority: (priority: Priority) => patch({ priority: PRIORITY_TO_NUMBER[priority] }),
        setStartDate: (days: number | null) => patch({ start_date: presetToIso(days) }),
        setTargetDate: (days: number | null) => patch({ target_date: presetToIso(days) }),
        moveToColumn: (columnId: string | null) => patch({ custom_column_id: columnId }),

        toggleTag: (tagId: string) => {
            const next = tagIds.has(tagId)
                ? [...tagIds].filter((id) => id !== tagId)
                : [...tagIds, tagId];
            patch({ tag_ids: next });
        },

        toggleAssignee: (userId: string) => {
            if (!ready) return;
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
        },

        copyField: (label: string, value: string) => {
            navigator.clipboard.writeText(value);
            toast.success(`Copied ${label}.`);
        },

        openInNewTab: () => window.open(issueHref(), "_blank"),

        duplicate: () => {
            if (!ready) return;
            createIssue.mutate(
                {
                    project_id: projectId!,
                    title: issue!.title,
                    description: issue!.description,
                    priority: issue!.priority as CreateIssueInput["priority"],
                    custom_column_id: issue!.customColumnId ?? undefined,
                    start_date: issue!.startDate ?? undefined,
                    target_date: issue!.targetDate ?? undefined,
                    assignee_ids: issue!.assignees.map((member) => member.id),
                    tag_ids: issue!.tags.map((tag) => tag.id),
                },
                {
                    onSuccess: () => toast.success("Duplicated issue."),
                    onError: () => toast.error("Couldn't duplicate the issue."),
                },
            );
        },

        requestDelete: () => issue && requestDelete(issue.id),
    };
}
