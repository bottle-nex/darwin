"use client";
import type { IssueTarget } from "@/store/issues/useIssueStore";
import type { PickableTemplate } from "@/types/issueTemplate";
import TemplatePicker from "./TemplatePicker";
import IssueTitleFields from "./IssueTitleFields";
import IssueFields from "./IssueFields";
import IssueBody from "./IssueBody";
import IssueSubmitFooter from "./IssueSubmitFooter";
import IssueChat from "./chat/IssueChat";
import { useIssueForm } from "./useIssueForm";

export default function CreateIssueForm({
    target,
    initialTemplate,
    onCreated,
}: {
    target: IssueTarget;
    initialTemplate?: PickableTemplate;
    onCreated: () => void;
}) {
    const form = useIssueForm({ target, issue: null, initialTemplate, onSubmitted: onCreated });

    return (
        <main className="flex min-h-0 min-w-0 flex-1 flex-row">
            <div className="flex min-h-0 min-w-0 w-[62%] max-w-[900px] flex-col justify-between *:px-6 *:py-4">
                <section className="flex flex-col items-start gap-y-3">
                    <div className="flex w-full items-center justify-end">
                        <TemplatePicker
                            projectId={form.projectId}
                            onPick={form.body.pickTemplate}
                        />
                    </div>
                    <IssueTitleFields form={form} />
                    <IssueFields form={form} layout="row" />
                </section>
                <section data-lenis-prevent className="no-scrollbar flex-1 min-h-0 overflow-y-auto">
                    <IssueBody form={form} />
                </section>
                <IssueSubmitFooter form={form} />
            </div>
            <IssueChat />
        </main>
    );
}
