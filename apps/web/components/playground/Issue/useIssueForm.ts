"use client";
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { toast } from "@/lib/toast";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useCreateIssue } from "@/hooks/issues/useCreateIssue";
import { useUpdateIssue } from "@/hooks/issues/useUpdateIssue";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import { PRIORITY_TO_NUMBER } from "@/components/playground/Home/KanbanDisplay/customkanban/data";
import type { Priority } from "@/types/kanban";
import type { BoardIssue } from "@/types/board";
import type { IssueTarget } from "@/store/issues/useCreateIssueStore";
import { useIssueDescription } from "./useIssueDescription";
import { useSubmitWarning } from "./SubmitWarningToast";

type UseIssueFormArgs = {
    target: IssueTarget;
    issue: BoardIssue | null;
    initialDescription?: string;
    readOnly?: boolean;
    onSubmitted?: () => void;
};

export type IssueFormFields = {
    title: string;
    setTitle: (value: string) => void;
    priority: Priority;
    setPriority: (value: Priority) => void;
    memberIds: string[];
    setMemberIds: (value: string[]) => void;
    tagIds: string[];
    setTagIds: (value: string[]) => void;
    startDate: Date | undefined;
    setStartDate: (value: Date | undefined) => void;
    targetDate: Date | undefined;
    setTargetDate: (value: Date | undefined) => void;
    membersOpen: boolean;
    setMembersOpen: (value: boolean) => void;
};

function sameIds(a: { id: string }[], b: { id: string }[]) {
    return a.length === b.length && a.every((item, index) => item.id === b[index].id);
}

export function useIssueForm({
    target,
    issue,
    initialDescription,
    readOnly = false,
    onSubmitted,
}: UseIssueFormArgs) {
    const projectId = useActiveProject()?.id;

    const isEdit = Boolean(issue);
    const isCustom = target.board === "custom";
    const [isMac] = useState(() => /Mac|iPhone|iPad/.test(navigator.userAgent));

    const [title, setTitle] = useState(issue?.title ?? "");
    const body = useIssueDescription(initialDescription);

    const [priority, setPriority] = useState<Priority>(
        issue ? (KanbanMappers.NUMBER_TO_PRIORITY[issue.priority] ?? "medium") : "medium",
    );
    const [memberIds, setMemberIds] = useState<string[]>(issue?.assignees.map((a) => a.id) ?? []);
    const [tagIds, setTagIds] = useState<string[]>(issue?.tags.map((t) => t.id) ?? []);
    const [startDate, setStartDate] = useState<Date | undefined>(
        issue?.startDate ? new Date(issue.startDate) : undefined,
    );
    const [targetDate, setTargetDate] = useState<Date | undefined>(
        issue?.targetDate ? new Date(issue.targetDate) : undefined,
    );
    const [membersOpen, setMembersOpen] = useState(false);

    const [syncedIssue, setSyncedIssue] = useState(issue);
    if (issue && syncedIssue && issue !== syncedIssue) {
        setSyncedIssue(issue);
        if (issue.title !== syncedIssue.title) setTitle(issue.title);
        if (issue.priority !== syncedIssue.priority) {
            setPriority(KanbanMappers.NUMBER_TO_PRIORITY[issue.priority] ?? "medium");
        }
        if (!sameIds(issue.assignees, syncedIssue.assignees)) {
            setMemberIds(issue.assignees.map((assignee) => assignee.id));
        }
        if (!sameIds(issue.tags, syncedIssue.tags)) {
            setTagIds(issue.tags.map((tag) => tag.id));
        }
        if (issue.startDate !== syncedIssue.startDate) {
            setStartDate(issue.startDate ? new Date(issue.startDate) : undefined);
        }
        if (issue.targetDate !== syncedIssue.targetDate) {
            setTargetDate(issue.targetDate ? new Date(issue.targetDate) : undefined);
        }
    }

    const createIssue = useCreateIssue();
    const updateIssue = useUpdateIssue();
    const pending = createIssue.isPending || updateIssue.isPending;
    const { warning, fire: fireWarning, shakeControls } = useSubmitWarning();

    const titleRef = useRef<HTMLTextAreaElement>(null);
    const editorRef = useRef<Editor | null>(null);

    /** The first unmet requirement, with a `focus` that puts the user where the fix goes. */
    function missingField(): { warning: string; focus: () => void } | null {
        const focusTitle = () => titleRef.current?.focus();
        const focusDescription = () => editorRef.current?.commands.focus("end");
        if (title.trim().length === 0) {
            return { warning: "The issue needs a title.", focus: focusTitle };
        }
        if (isEdit || isCustom) return null;
        if (body.isEmpty) {
            return { warning: "Add a description first.", focus: focusDescription };
        }
        if (body.prompts > 0) {
            return {
                warning: `${body.prompts} template field${body.prompts === 1 ? "" : "s"} left to fill.`,
                focus: focusDescription,
            };
        }
        if (memberIds.length === 0) {
            return { warning: "Assign at least one member.", focus: () => setMembersOpen(true) };
        }
        return null;
    }

    async function submit(): Promise<boolean> {
        if (pending || !projectId) return false;
        const missing = missingField();
        if (missing) {
            fireWarning(missing.warning);
            missing.focus();
            return false;
        }
        try {
            if (issue) {
                await updateIssue.mutateAsync({
                    id: issue.id,
                    project_id: projectId,
                    title: title.trim(),
                    description: body.toHtml(),
                    priority: PRIORITY_TO_NUMBER[priority],
                    assignee_ids: memberIds,
                    tag_ids: tagIds,
                    start_date: startDate?.toISOString() ?? null,
                    target_date: targetDate?.toISOString() ?? null,
                });
            } else {
                await createIssue.mutateAsync({
                    project_id: projectId,
                    title: title.trim(),
                    description: body.toHtml(),
                    priority: PRIORITY_TO_NUMBER[priority],
                    custom_column_id: target.board === "custom" ? target.columnId : undefined,
                    assignee_ids: memberIds,
                    tag_ids: tagIds,
                    start_date: startDate?.toISOString(),
                    target_date: targetDate?.toISOString(),
                });
            }
            onSubmitted?.();
            return true;
        } catch {
            toast.error(isEdit ? "Couldn't update the issue." : "Couldn't create the issue.");
            return false;
        }
    }

    const submitRef = useRef(submit);
    useEffect(() => {
        submitRef.current = submit;
    });

    useEffect(() => {
        if (readOnly) return;
        function onKeyDown(event: KeyboardEvent) {
            if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter" || event.isComposing) {
                return;
            }
            event.preventDefault();
            submitRef.current();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [readOnly]);

    function hasEdits(): boolean {
        if (!issue || readOnly) return false;
        return (
            title !== issue.title ||
            body.isDirty ||
            priority !== (KanbanMappers.NUMBER_TO_PRIORITY[issue.priority] ?? "medium") ||
            !sameIdSet(
                memberIds,
                issue.assignees.map((a) => a.id),
            ) ||
            !sameIdSet(
                tagIds,
                issue.tags.map((t) => t.id),
            ) ||
            startDate?.getTime() !== dateValue(issue.startDate) ||
            targetDate?.getTime() !== dateValue(issue.targetDate)
        );
    }

    const isDirty = hasEdits();

    const fields: IssueFormFields = {
        title,
        setTitle,
        priority,
        setPriority,
        memberIds,
        setMemberIds,
        tagIds,
        setTagIds,
        startDate,
        setStartDate,
        targetDate,
        setTargetDate,
        membersOpen,
        setMembersOpen,
    };

    return {
        fields,
        body,
        submit,
        pending,
        warning,
        shakeControls,
        titleRef,
        editorRef,
        isEdit,
        isCustom,
        isMac,
        projectId,
        readOnly,
        isDirty,
    };
}

function sameIdSet(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sortedB = [...b].sort();
    return [...a].sort().every((id, index) => id === sortedB[index]);
}

function dateValue(value: string | Date | null | undefined): number | undefined {
    return value ? new Date(value).getTime() : undefined;
}

export type IssueFormState = ReturnType<typeof useIssueForm>;
