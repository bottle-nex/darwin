"use client";
import LLMIssueStatusTicker from "@/components/playground/Home/KanbanDisplay/LLMIssueStatusTicker";
import type { BoardIssue } from "@/types/board";

import IssueAttachments from "./IssueAttachments";
import IssueFields from "./IssueFields";
import HarnessCapsules from "./HarnessCapsule";
import PropertyGroup from "./PropertyGroup";
import type { IssueFormState } from "./useIssueForm";

export default function IssueProperties({
    form,
    issue,
}: {
    form: IssueFormState;
    issue: BoardIssue;
}) {
    return (
        <aside
            data-lenis-prevent
            className="no-scrollbar flex min-h-0 flex-col gap-y-7 overflow-y-auto px-5 py-12"
        >
            <PropertyGroup title="Properties">
                <LLMIssueStatusTicker
                    status={issue.status}
                    className="text-[13px] [&_svg]:size-[18px]"
                />
                <IssueFields form={form} layout="stacked" />
            </PropertyGroup>
            <PropertyGroup title="Tags">
                <IssueFields form={form} layout="tags" />
            </PropertyGroup>
            <PropertyGroup title="Agent">
                <HarnessCapsules harnessConfig={form.harnessConfig} />
            </PropertyGroup>
            <IssueAttachments issue={issue} />
        </aside>
    );
}
