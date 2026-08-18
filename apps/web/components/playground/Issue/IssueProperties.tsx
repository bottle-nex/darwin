"use client";
import type { ReactNode } from "react";
import type { BoardIssue } from "@/types/board";
import LLMIssueStatusTicker from "@/components/playground/Home/KanbanDisplay/LLMIssueStatusTicker";
import IssueFields from "./IssueFields";
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
            className="no-scrollbar flex w-64 shrink-0 flex-col gap-y-7 overflow-y-auto px-5 py-12"
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
        </aside>
    );
}

function PropertyGroup({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-y-2">
            <h2 className="text-[13px] text-neutral-500 ml-2.5">{title}</h2>
            <div className="flex flex-col items-start gap-y-0.5">{children}</div>
        </section>
    );
}
