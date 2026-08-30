"use client";
import type { IconType } from "@trymatcha/ui/icons";
import {
    CopyFieldIdIcon,
    CopyFieldMarkdownIcon,
    CopyFieldNumberIcon,
    CopyFieldTitleIcon,
    CopyFieldUrlIcon,
} from "@trymatcha/ui/icons";
import { isAxiosError } from "axios";

import { PRIORITY_TO_NUMBER } from "@/components/playground/Home/KanbanDisplay/customkanban/data";
import { isEditable } from "@/components/playground/Issue/issueHelpers";
import { useAssignIssue, useUnassignIssue } from "@/hooks/issues/useAssignIssue";
import { useSpaceBoards } from "@/hooks/issues/useBoardColumns";
import { useBulkUpdateIssues } from "@/hooks/issues/useBulkUpdateIssues";
import { type CreateIssueInput, useCreateIssue } from "@/hooks/issues/useCreateIssue";
import { useIssues } from "@/hooks/issues/useIssue";
import { type UpdateIssueInput, useUpdateIssue } from "@/hooks/issues/useUpdateIssue";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { useListTags } from "@/hooks/tags/useListTags";
import { useActiveProject } from "@/hooks/useActiveProject";
import { htmlToMarkdown } from "@/lib/markdown";
import { toast } from "@/lib/toast";
import { useDeleteIssueStore } from "@/store/issues/useDeleteIssueStore";
import type { BoardIssue, ServerIssueStatus } from "@/types/board";
import type { Priority } from "@/types/kanban";

export const COPY_FIELDS: {
    label: string;
    icon: IconType;
    value: (issue: BoardIssue, url: string) => string;
}[] = [
    { label: "URL", icon: CopyFieldUrlIcon, value: (_issue, url) => url },
    { label: "title", icon: CopyFieldTitleIcon, value: (issue) => issue.title },
    { label: "issue number", icon: CopyFieldNumberIcon, value: (issue) => `#${issue.number}` },
    { label: "issue ID", icon: CopyFieldIdIcon, value: (issue) => issue.id },
    {
        label: "description as markdown",
        icon: CopyFieldMarkdownIcon,
        value: (issue) => htmlToMarkdown(issue.description),
    },
];

export type IssueActions = ReturnType<typeof useIssueActions>;

type IssueActionTarget = BoardIssue | BoardIssue[] | string | string[] | null | undefined;

function resolveIssueActionTarget(target: IssueActionTarget) {
    if (!target) return { issueIds: [], suppliedIssues: [] };
    if (typeof target === "string") return { issueIds: [target], suppliedIssues: [] };
    if (!Array.isArray(target)) return { issueIds: [target.id], suppliedIssues: [target] };
    if (target.every((item) => typeof item === "string")) {
        return { issueIds: target, suppliedIssues: [] };
    }
    const suppliedIssues = target as BoardIssue[];
    return { issueIds: suppliedIssues.map((issue) => issue.id), suppliedIssues };
}

function shared<T>(issues: BoardIssue[], read: (issue: BoardIssue) => T): T | undefined {
    if (!issues.length) return undefined;
    const first = read(issues[0]);
    return issues.every((issue) => read(issue) === first) ? first : undefined;
}

function sharedMembership(issues: BoardIssue[], read: (issue: BoardIssue) => { id: string }[]) {
    if (!issues.length) return new Set<string>();
    return new Set(
        read(issues[0])
            .map((member) => member.id)
            .filter((id) => issues.every((issue) => read(issue).some((row) => row.id === id))),
    );
}

/**
 * Every mutation the product offers on an issue, in one place, so the context
 * menu and the command menu drive issues through the same handlers. Given many
 * ids it drives them all through the bulk endpoints.
 */
export function useIssueActions(target: IssueActionTarget) {
    const projectId = useActiveProject()?.id;
    const { issueIds, suppliedIssues } = resolveIssueActionTarget(target);
    const issueQuery = useIssues(projectId, suppliedIssues.length ? [] : issueIds);
    const issues = suppliedIssues.length ? suppliedIssues : issueQuery.issues;
    const isComplete = suppliedIssues.length > 0 || issueQuery.isComplete;
    const issue = issues.length === 1 ? issues[0] : undefined;

    const spaceBoards = useSpaceBoards(projectId);
    const { data: members } = useProjectMembers(projectId);
    const { data: tags } = useListTags(projectId);

    const updateIssue = useUpdateIssue();
    const bulkUpdateIssues = useBulkUpdateIssues();
    const createIssue = useCreateIssue();
    const assignIssue = useAssignIssue();
    const unassignIssue = useUnassignIssue();
    const requestDelete = useDeleteIssueStore((s) => s.requestDelete);

    const ready = Boolean(isComplete && issues.length && projectId);
    const editable = ready && issues.every(isEditable);
    const assigneeIds = sharedMembership(issues, (row) => row.assignees);
    const tagIds = sharedMembership(issues, (row) => row.tags);

    const failureNote =
        issues.length > 1 ? "Couldn't update those issues." : "Couldn't update the issue.";

    function patch(input: Omit<UpdateIssueInput, "id" | "project_id">) {
        if (!ready) return;
        if (issues.length > 1) {
            bulkUpdateIssues.mutate(
                { issue_ids: issues.map((row) => row.id), project_id: projectId!, ...input },
                { onError: () => toast.error(failureNote) },
            );
            return;
        }
        updateIssue.mutate(
            { id: issues[0].id, project_id: projectId!, ...input },
            { onError: () => toast.error(failureNote) },
        );
    }

    function patchMembership(input: {
        add_tag_ids?: string[];
        remove_tag_ids?: string[];
        add_assignee_ids?: string[];
        remove_assignee_ids?: string[];
    }) {
        if (!ready) return;
        bulkUpdateIssues.mutate(
            { issue_ids: issues.map((row) => row.id), project_id: projectId!, ...input },
            { onError: () => toast.error(failureNote) },
        );
    }

    function issueHref(): string {
        const base = window.location.pathname.replace(/\/issue\/[^/]+\/?$/, "");
        return `${window.location.origin}${base}/issue/${issue?.id}`;
    }

    return {
        issue,
        issues,
        count: issues.length,
        sharedStatus: shared(issues, (row) => row.status),
        sharedPriority: shared(issues, (row) => row.priority),
        sharedColumnId: shared(issues, (row) => row.customColumnId),
        projectId,
        spaceBoards,
        members: members ?? [],
        tags: tags ?? [],
        editable,
        assigneeIds,
        tagIds,
        issueHref,

        setStatus: (status: ServerIssueStatus) => patch({ status, custom_column_id: null }),
        setPriority: (priority: Priority) => patch({ priority: PRIORITY_TO_NUMBER[priority] }),
        setStartDate: (iso: string | null) => patch({ start_date: iso }),
        setTargetDate: (iso: string | null) => patch({ target_date: iso }),
        moveToColumn: (columnId: string | null) => patch({ custom_column_id: columnId }),

        toggleTag: (tagId: string) => {
            if (issues.length > 1) {
                patchMembership(
                    tagIds.has(tagId) ? { remove_tag_ids: [tagId] } : { add_tag_ids: [tagId] },
                );
                return;
            }
            const next = tagIds.has(tagId)
                ? [...tagIds].filter((id) => id !== tagId)
                : [...tagIds, tagId];
            patch({ tag_ids: next });
        },

        toggleAssignee: (userId: string) => {
            if (!ready) return;
            if (issues.length > 1) {
                patchMembership(
                    assigneeIds.has(userId)
                        ? { remove_assignee_ids: [userId] }
                        : { add_assignee_ids: [userId] },
                );
                return;
            }
            const mutation = assigneeIds.has(userId) ? unassignIssue : assignIssue;
            mutation.mutate(
                { id: issues[0].id, project_id: projectId!, user_id: userId },
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
            if (!issue || !projectId) return;
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

        requestDelete: () => ready && requestDelete(issueIds),
    };
}
