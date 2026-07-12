"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IssueStatus } from "@trymatcha/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useCreateIssue } from "@/hooks/issues/useCreateIssue";
import { useUpdateIssue } from "@/hooks/issues/useUpdateIssue";
import { useIssueDialog } from "@/components/playground/issue/useIssueDialog";
import type { IssueTarget } from "@/store/issues/useCreateOrEditIssueStore";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import type { BoardColumn, BoardIssue } from "@/types/board";
import Capsule, { type CapsuleOption } from "./Capsule";
import MembersCapsule from "./MembersCapsule";
import TagsCapsule from "./TagsCapsule";
import IssueDescriptionEditor from "./editor/IssueDescriptionEditor";
import type { Priority } from "@/types/kanban";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import { TaskTargetBadge } from "../taskTheme";
import { PRIORITY_TO_NUMBER } from "../customkanban/data";
import { BsChatRightTextFill } from "react-icons/bs";
import IssueTags from "../IssueTags";
import LLMIssueStatusTicker from "../LLMIssueStatusTicker";
import { LuInfo } from "react-icons/lu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { IoIosSend } from "react-icons/io";
import { useListTemplates } from "@/hooks/templates/useListTemplates";
import type { PickableTemplate } from "@/types/issueTemplate";
import TemplatePicker from "./TemplatePicker";
import { useIssueDescription } from "./useIssueDescription";

const PRIORITY_OPTIONS: CapsuleOption[] = [
    { value: "urgent", label: "Urgent", dotClassName: "bg-rose-500" },
    { value: "high", label: "High", dotClassName: "bg-amber-400" },
    { value: "normal", label: "Normal", dotClassName: "bg-neutral-500" },
    { value: "low", label: "Low", dotClassName: "bg-neutral-600" },
];

/** Parked cards and untouched To-Dos are ours; anything else belongs to the agent. */
function isEditable(issue: BoardIssue): boolean {
    return issue.status === IssueStatus.Todo || issue.status === IssueStatus.Parked;
}

/** An issue already knows where it lives, so its target is derived, never passed. */
function targetForIssue(issue: BoardIssue, columns: BoardColumn[]): IssueTarget {
    if (!issue.customColumnId) return { board: "llm" };
    const column = columns.find((c) => c.id === issue.customColumnId);
    return {
        board: "custom",
        columnId: issue.customColumnId,
        columnTitle: column?.label ?? "",
    };
}

export default function CreateOrEditIssueDialog() {
    const { mode } = useIssueDialog();
    if (!mode) return null;
    if (mode.kind === "create") return <CreateIssue target={mode.target} />;
    return <EditIssue issueId={mode.issueId} />;
}

function CreateIssue({ target }: { target: IssueTarget }) {
    const projectId = useActiveProject()?.id;
    const { data: templates, isPending } = useListTemplates(projectId);

    if (projectId && isPending) return <IssuePending resolved={false} />;

    const defaultTemplate = templates?.find((template) => template.isDefault);
    return <IssueForm target={target} issue={null} initialTemplate={defaultTemplate} />;
}

function EditIssue({ issueId }: { issueId: string }) {
    const projectId = useActiveProject()?.id;
    const { data: board } = useBoard(projectId);

    // A deep link lands here before the board query resolves.
    const issue = board?.issues.find((i) => i.id === issueId);
    if (!board || !issue) return <IssuePending resolved={Boolean(board)} />;

    const target = targetForIssue(issue, board.columns);
    return isEditable(issue) ? (
        <IssueForm
            key={issue.id}
            target={target}
            issue={issue}
            initialDescription={issue.description}
        />
    ) : (
        <LockedIssue key={issue.id} target={target} issue={issue} />
    );
}

function IssuePending({ resolved }: { resolved: boolean }) {
    return (
        <IssueShell>
            <div className="flex flex-col items-start gap-y-2">
                <DialogTitle className="text-left text-base text-neutral-100">Issue</DialogTitle>
                <p className="text-[13px] text-neutral-500">
                    {resolved ? "This issue no longer exists." : "Loading this issue…"}
                </p>
            </div>
        </IssueShell>
    );
}

function IssueTopper({
    target,
    issue,
    action,
}: {
    target: IssueTarget;
    issue: BoardIssue | null;
    action?: React.ReactNode;
}) {
    return (
        <section className="flex items-center justify-between w-full">
            <div className="flex w-full items-center gap-2">
                <TaskTargetBadge
                    kind={target.board}
                    columnTitle={target.board === "custom" ? target.columnTitle : undefined}
                />
                {issue && (
                    <div className="ml-auto flex items-center gap-2">
                        <span className="font-mono text-[11px] text-neutral-500">
                            #{issue.number}
                        </span>
                        <LLMIssueStatusTicker status={issue.status} size="sm" showIcon={false} />
                    </div>
                )}
            </div>
            {action}
        </section>
    );
}

function Assignees({ issue }: { issue: BoardIssue }) {
    if (!issue.assignees.length) return null;
    return (
        <div className="flex items-center -space-x-1">
            {issue.assignees.map(KanbanMappers.toAssignee).map((a) => (
                <PlaygroundAvatar
                    key={a.id}
                    letter={a.name.charAt(0).toUpperCase()}
                    src={a.image}
                    tone={a.tone}
                />
            ))}
        </div>
    );
}

function LockedIssue({ target, issue }: { target: IssueTarget; issue: BoardIssue }) {
    const { close } = useIssueDialog();
    const priority = KanbanMappers.NUMBER_TO_PRIORITY[issue.priority] ?? "normal";

    return (
        <IssueShell>
            <div className="flex flex-col items-start gap-y-3 ">
                <IssueTopper target={target} issue={issue} />
                <DialogTitle className="text-left text-3xl font-semibold text-neutral-100">
                    {issue.title}
                </DialogTitle>
                <div className="flex items-center gap-x-2.5">
                    <span className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1 text-xs text-white/55 ring ring-white/10">
                        <span
                            className={cn(
                                "size-2 rounded-full",
                                KanbanBoard.PRIORITY_DOT[priority],
                            )}
                            aria-hidden
                        />
                        {PRIORITY_OPTIONS.find((p) => p.value === priority)?.label}
                    </span>
                    <IssueTags tags={issue.tags} max={6} size="md" />
                    <Assignees issue={issue} />
                </div>
            </div>
            <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto ">
                <IssueDescriptionEditor editable={false} initialContent={issue.description} />
            </div>
            <div className="h-fit flex items-center justify-between">
                <div className="flex items-center justify-center gap-x-1 text-xs text-white/70">
                    <LuInfo size={10} />
                    <span>
                        The agent has picked this issue up. It can&apos;t be edited while it runs.
                    </span>
                </div>
                <Button variant={"tertiary"} onClick={close}>
                    Close
                </Button>
            </div>
        </IssueShell>
    );
}

function IssueChat() {
    const [message, setMessage] = useState("");

    return (
        <section className="m-2.5 flex min-h-0 flex-1 flex-col rounded-[13px] bg-white/3 *:px-4 *:py-3">
            <header className="text-sm font-medium text-neutral-100 flex items-center gap-x-3">
                <BsChatRightTextFill />
                <span>Comments and activity</span>
            </header>
            <div
                data-lenis-prevent
                className="no-scrollbar flex-1 min-h-0 overflow-y-auto text-[13px] text-neutral-500"
            />
            <footer className="flex items-center gap-x-2">
                <Input
                    placeholder="Leave a comment..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="h-9 placeholder:text-[13px]!"
                />
                <Button size="icon" disabled={!message.trim()} aria-label="Send comment">
                    <IoIosSend />
                </Button>
            </footer>
        </section>
    );
}

function IssueForm({
    target,
    issue,
    initialDescription,
    initialTemplate,
}: {
    target: IssueTarget;
    issue: BoardIssue | null;
    initialDescription?: string;
    initialTemplate?: PickableTemplate;
}) {
    const { close } = useIssueDialog();
    const projectId = useActiveProject()?.id;

    const isEdit = Boolean(issue);
    const isCustom = target.board === "custom";

    const [title, setTitle] = useState(issue?.title ?? "");
    const [summary, setSummary] = useState(issue?.summary ?? "");
    const body = useIssueDescription(initialDescription, initialTemplate);

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
            <main className="flex h-full min-h-0 flex-row">
                <div className="flex h-full min-h-0 flex-col justify-between *:px-6 *:py-4 w-[64%]">
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
                                autoFocus
                                variant={"ghost"}
                                placeholder="Issue Title"
                                maxLength={80}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-3xl ring-0 border-0 font-semibold h-8 p-0 bg-transparent hover:bg-transparent! rounded-none"
                            />
                            <Input
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
                            />
                            <TagsCapsule
                                projectId={projectId}
                                defaultValue={tagIds}
                                onChange={setTagIds}
                            />
                            <MembersCapsule
                                projectId={projectId}
                                defaultValue={memberIds}
                                onChange={setMemberIds}
                            />
                            <Capsule
                                type="calendar"
                                placeholder="Start date"
                                defaultValue={startDate}
                                onChange={setStartDate}
                            />
                            <Capsule
                                type="calendar"
                                placeholder="Target date"
                                defaultValue={targetDate}
                                onChange={setTargetDate}
                            />
                        </div>
                    </section>
                    <section
                        data-lenis-prevent
                        className="no-scrollbar flex-1 min-h-0 overflow-y-auto"
                    >
                        <IssueDescriptionEditor
                            key={body.editorKey}
                            initialContent={body.html}
                            onChange={body.onEditorChange}
                        />
                    </section>
                    <section className="h-fit flex items-center justify-between gap-x-20">
                        <div className="flex items-start justify-center gap-x-1 text-xs text-white/70">
                            <LuInfo className="mt-0.75" size={10} />
                            <span className="">
                                The more you tell the agent, the better it solves this. Detail costs
                                you a minute and saves it a wrong guess.
                            </span>
                        </div>
                        <div className="flex items-center justify-end gap-x-2 ">
                            {!isEdit && !isCustom && <BodyGate body={body} />}
                            <Button variant={"tertiary"} onClick={close}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={!canSubmit}>
                                {pending
                                    ? isEdit
                                        ? "Saving..."
                                        : "Creating..."
                                    : isEdit
                                      ? "Save"
                                      : "Create Issue"}
                            </Button>
                        </div>
                    </section>
                </div>
                <IssueChat />
            </main>
        </IssueShell>
    );
}

function BodyGate({ body }: { body: ReturnType<typeof useIssueDescription> }) {
    if (body.prompts === 0) return null;
    return (
        <span className="shrink-0 text-xs text-white/45">
            {body.prompts} field{body.prompts === 1 ? "" : "s"} left
        </span>
    );
}

function IssueShell({ children }: { children: React.ReactNode }) {
    const { close } = useIssueDialog();
    return (
        <Dialog open onOpenChange={close}>
            <DialogContent
                showCloseButton={false}
                className={cn(
                    "h-[80vh] w-[72vw] max-w-none sm:max-w-none p-0 gap-0 overflow-hidden",
                    "bg-[#191919] rounded-[18px]",
                    "",
                )}
            >
                <div
                    data-slot="slash-command-portal"
                    className="absolute inset-0 z-50 pointer-events-none"
                />
                {children}
            </DialogContent>
        </Dialog>
    );
}
