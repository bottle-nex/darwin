"use client";
import type { IssueTarget } from "@/store/issues/useIssueStore";
import type { PickableTemplate } from "@/types/issueTemplate";
import TemplatePicker from "./TemplatePicker";
import IssueTitleField from "./IssueTitleField";
import IssueFields from "./IssueFields";
import IssueBody from "./IssueBody";
import IssueSubmitAction from "./IssueSubmitAction";
import { useIssueForm } from "./useIssueForm";
import { useActiveProject } from "@/hooks/useActiveProject";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import PlaygroundAvatar from "../Core/components/PlaygroundAvatar";

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
    const project = useActiveProject();
    return (
        <main className="flex min-h-0 min-w-0 flex-1 flex-col justify-between *:px-6">
            <section className="flex flex-col items-start gap-y-3 pt-4 pb-2">
                <div className="flex w-full items-center justify-between">
                    <div className="flex items-center justify-start gap-x-1 text-snow text-xs">
                        <PlaygroundAvatar
                            letter={project?.name.slice(0, 2) ?? ""}
                            tone="emerald"
                            className="uppercase"
                        />
                        <span>
                            <MdOutlineKeyboardArrowRight />
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
                <IssueSubmitAction form={form} />
            </section>
        </main>
    );
}
