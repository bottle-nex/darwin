"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LuInfo } from "react-icons/lu";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useCreateIssue } from "@/hooks/issues/useCreateIssue";
import { useUpdateIssue } from "@/hooks/issues/useUpdateIssue";
import { useIssueDialog } from "@/components/playground/issue/useIssueDialog";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import { PRIORITY_TO_NUMBER } from "../customkanban/data";
import type { Priority } from "@/types/kanban";
import type { BoardIssue } from "@/types/board";
import type { IssueTarget } from "@/store/issues/useCreateOrEditIssueStore";
import type { PickableTemplate } from "@/types/issueTemplate";
import Capsule from "./Capsule";
import MembersCapsule from "./MembersCapsule";
import TagsCapsule from "./TagsCapsule";
import TemplatePicker from "./TemplatePicker";
import IssueDescriptionEditor from "./editor/IssueDescriptionEditor";
import { useIssueDescription } from "./useIssueDescription";
import IssueShell from "./IssueShell";
import IssueTopper from "./IssueTopper";
import IssueChat from "./chat/IssueChat";
import { PRIORITY_OPTIONS } from "./issueHelpers";

export default function IssueForm({
    target,
    issue,
    initialDescription,
    initialTemplate,
    readOnly = false,
}: {
    target: IssueTarget;
    issue: BoardIssue | null;
    initialDescription?: string;
    initialTemplate?: PickableTemplate;
    readOnly?: boolean;
}) {
    const { close } = useIssueDialog();
    const projectId = useActiveProject()?.id;

    const isEdit = Boolean(issue);
    const isCustom = target.board === "custom";

    const [title, setTitle] = useState(issue?.title ?? "");
    const [summary, setSummary] = useState(issue?.summary ?? "");
    const body = useIssueDescription(initialDescription, initialTemplate);

    useEffect(() => {
        if (!isEdit && initialTemplate && body.isEmpty && body.prompts === 0) {
            body.pickTemplate(initialTemplate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialTemplate]);

    const [priority, setPriority] = useState<Priority>(
        issue ? (KanbanMappers.NUMBER_TO_PRIORITY[issue.priority] ?? "normal") : "normal",
    );
    const [memberIds, setMemberIds] = useState<string[]>(issue?.assignees.map((a) => a.id) ?? []);
    const [tagIds, setTagIds] = useState<string[]>(issue?.tags.map((t) => t.id) ?? []);
    const [startDate, setStartDate] = useState<Date | undefined>(
        issue?.startDate ? new Date(issue.startDate) : undefined,
    );
    const [targetDate, setTargetDate] = useState<Date | undefined>(
        issue?.targetDate ? new Date(issue.targetDate) : undefined,
    );

    const createIssue = useCreateIssue();
    const updateIssue = useUpdateIssue();
    const pending = createIssue.isPending || updateIssue.isPending;

    const canSubmit =
        title.trim().length > 0 &&
        Boolean(projectId) &&
        !pending &&
        (isEdit || isCustom || (body.ready && memberIds.length > 0));

    async function handleSubmit() {
        if (!canSubmit || !projectId) return;
        try {
            if (issue) {
                await updateIssue.mutateAsync({
                    id: issue.id,
                    project_id: projectId,
                    title: title.trim(),
                    summary: summary.trim() || null,
                    description: body.toHtml(),
                    priority: PRIORITY_TO_NUMBER[priority],
                    assignee_ids: memberIds,
                    tag_ids: tagIds,
                    // Explicit `null` — an omitted date reads as "unchanged", so
                    // clearing one in the picker would never reach the server.
                    start_date: startDate?.toISOString() ?? null,
                    target_date: targetDate?.toISOString() ?? null,
                });
            } else {
                await createIssue.mutateAsync({
                    project_id: projectId,
                    title: title.trim(),
                    summary: summary.trim() || undefined,
                    description: body.toHtml(),
                    priority: PRIORITY_TO_NUMBER[priority],
                    custom_column_id: target.board === "custom" ? target.columnId : undefined,
                    assignee_ids: memberIds,
                    tag_ids: tagIds,
                    start_date: startDate?.toISOString(),
                    target_date: targetDate?.toISOString(),
                });
            }
            close();
        } catch {
            toast.error(isEdit ? "Couldn't update the issue." : "Couldn't create the issue.");
        }
    }

    return (
        <IssueShell>
            <main className="flex h-full min-h-0 min-w-0 flex-row">
                <div className="flex h-full min-h-0 min-w-0 flex-col justify-between *:px-6 *:py-4 w-[62%]">
                    <section className="flex flex-col items-start gap-y-3 ">
                        <IssueTopper
                            target={target}
                            issue={issue}
                            action={
                                isEdit ? undefined : (
                                    <TemplatePicker
                                        projectId={projectId}
                                        onPick={body.pickTemplate}
                                    />
                                )
                            }
                        />
                        <div className="w-full flex flex-col items-start ">
                            <Input
                                autoFocus={!readOnly}
                                readOnly={readOnly}
                                variant={"ghost"}
                                placeholder="Issue Title"
                                maxLength={80}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-3xl ring-0 border-0 font-semibold h-8 p-0 bg-transparent hover:bg-transparent! rounded-none"
                            />
                            <Input
                                readOnly={readOnly}
                                variant={"ghost"}
                                placeholder="Add a short summary..."
                                maxLength={255}
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                className="h-7 p-0 bg-transparent hover:bg-transparent! rounded-none"
                            />
                        </div>
                        <div className="flex items-center gap-x-2.5">
                            <Capsule
                                type="dropdown"
                                options={PRIORITY_OPTIONS}
                                defaultValue={priority}
                                onChange={(value) => setPriority(value as Priority)}
                                disabled={readOnly}
                            />
                            <TagsCapsule
                                projectId={projectId}
                                defaultValue={tagIds}
                                onChange={setTagIds}
                                disabled={readOnly}
                            />
                            <MembersCapsule
                                projectId={projectId}
                                defaultValue={memberIds}
                                onChange={setMemberIds}
                                disabled={readOnly}
                            />
                            <Capsule
                                type="calendar"
                                placeholder="Start date"
                                defaultValue={startDate}
                                onChange={setStartDate}
                                disabled={readOnly}
                            />
                            <Capsule
                                type="calendar"
                                placeholder="Target date"
                                defaultValue={targetDate}
                                onChange={setTargetDate}
                                disabled={readOnly}
                            />
                        </div>
                    </section>
                    <section
                        data-lenis-prevent
                        className="no-scrollbar flex-1 min-h-0 overflow-y-auto"
                    >
                        <IssueDescriptionEditor
                            key={body.editorKey}
                            editable={!readOnly}
                            initialContent={body.html}
                            onChange={body.onEditorChange}
                        />
                    </section>
                    {readOnly ? (
                        <section className="h-fit flex items-center justify-between">
                            <div className="flex items-center gap-x-1 text-xs text-white/70">
                                <LuInfo size={10} />
                                <span>
                                    The agent has picked this issue up. It can&apos;t be edited
                                    while it runs.
                                </span>
                            </div>
                            <Button variant={"tertiary"} onClick={close}>
                                Close
                            </Button>
                        </section>
                    ) : (
                        <section className="h-fit flex items-center justify-end gap-x-20">
                            <div className="flex items-center justify-end gap-x-2 ">
                                {!isEdit && !isCustom && <BodyGate body={body} />}
                                <Button
                                    className="rounded-full"
                                    variant={"tertiary"}
                                    onClick={handleSubmit}
                                    loading={pending}
                                    disabled={!canSubmit}
                                >
                                    {isEdit ? "Save" : "Create Issue"}
                                </Button>
                            </div>
                        </section>
                    )}
                </div>
                <IssueChat issueId={issue?.id} />
            </main>
        </IssueShell>
    );
}

/** Nudge on the create form: how many required description fields are still blank. */
function BodyGate({ body }: { body: ReturnType<typeof useIssueDescription> }) {
    if (body.prompts === 0) return null;
    return (
        <span className="shrink-0 text-xs text-white/45">
            {body.prompts} field{body.prompts === 1 ? "" : "s"} left
        </span>
    );
}
