"use client";
import { BreadcrumbSeparatorIcon } from "@trydarwin/ui/icons";

import { useActiveProject } from "@/hooks/useActiveProject";
import type { IssueTarget } from "@/store/issues/useCreateIssueStore";

import PlaygroundAvatar, { toneFor } from "../Core/components/PlaygroundAvatar";
import IssueBody from "./IssueBody";
import IssueFields from "./IssueFields";
import IssueSubmitAction from "./IssueSubmitAction";
import IssueTitleField from "./IssueTitleField";
import SubmitWarningToast from "./SubmitWarningToast";
import TemplatePicker from "./TemplatePicker";
import { useIssueForm } from "./useIssueForm";

export default function CreateIssueForm({
    target,
    onCreated,
}: {
    target: IssueTarget;
    onCreated: () => void;
}) {
    const form = useIssueForm({ target, issue: null, onSubmitted: onCreated });
    const project = useActiveProject();
    return (
        <div className="relative isolate flex min-h-0 min-w-0 flex-1 flex-col">
            <SubmitWarningToast warning={form.warning} placement="top-center" />
            <main className="z-10 flex min-h-0 min-w-0 flex-1 flex-col justify-between overflow-hidden *:px-6">
                <section className="flex flex-col items-start gap-y-3 pt-4 pb-2">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex items-center justify-start gap-x-1 text-snow text-xs">
                            <PlaygroundAvatar
                                letter={project?.name.slice(0, 2) ?? ""}
                                tone={project ? toneFor(project.id) : "emerald"}
                                icon={project?.icon}
                                className="uppercase"
                            />
                            <span>
                                <BreadcrumbSeparatorIcon />
                            </span>
                            <span className="text-sm">New Issue</span>
                        </div>
                        <TemplatePicker
                            projectId={form.projectId}
                            onPick={form.body.pickTemplate}
                        />{" "}
                    </div>
                    <IssueTitleField form={form} />
                </section>
                <section
                    data-lenis-prevent
                    className="no-scrollbar flex-1 min-h-0 overflow-y-auto pb-4"
                >
                    <IssueBody form={form} />
                </section>
                <section className="flex flex-col gap-y-4 pb-4">
                    <IssueFields form={form} layout="row" />
                    <IssueSubmitAction form={form} showWarning={false} />
                </section>
            </main>
        </div>
    );
}
