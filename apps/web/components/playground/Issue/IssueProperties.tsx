"use client";
import LLMIssueStatusTicker from "@/components/playground/Home/KanbanDisplay/LLMIssueStatusTicker";
import type { BoardIssue } from "@/types/board";

import HarnessCapsules from "./HarnessCapsule";
import IssueAttachments from "./IssueAttachments";
import IssueFieldChip from "./IssueFieldChip";
import IssueFields from "./IssueFields";
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
                <IssueFieldChip
                    issueId={issue.id}
                    issue={issue}
                    field="status"
                    disabled={form.readOnly}
                    className="w-fit cursor-pointer"
                >
                    <LLMIssueStatusTicker
                        status={issue.status}
                        className="text-[13px] [&_svg]:size-[18px]"
                    />
                </IssueFieldChip>
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
