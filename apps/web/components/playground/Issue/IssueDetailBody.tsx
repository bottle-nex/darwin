"use client";
import { useState } from "react";

import { cn } from "@/lib/utils";

import ActivityFeed from "./activity/ActivityFeed";
import IssueBody from "./IssueBody";
import IssueTitleField from "./IssueTitleField";
import PendingQuestions from "./PendingQuestions";
import type { IssueFormState } from "./useIssueForm";

export default function IssueDetailBody({
    form,
    issueId,
    embedded,
}: {
    form: IssueFormState;
    issueId: string;
    embedded: boolean;
}) {
    const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);

    return (
        <div
            ref={setScrollElement}
            data-lenis-prevent
            className={cn(
                "no-scrollbar min-h-0 flex-1 overflow-y-auto",
                embedded ? "px-6 py-5" : "px-10 py-8",
            )}
        >
            <div className="flex w-full flex-col gap-y-4">
                <div onContextMenu={(event) => event.stopPropagation()}>
                    <IssueTitleField form={form} />
                </div>
                <div onContextMenu={(event) => event.stopPropagation()}>
                    <IssueBody form={form} />
                </div>
                <div className="h-px w-full bg-border" />
                <ActivityFeed issueId={issueId} scrollElement={scrollElement} />
                <PendingQuestions issueId={issueId} />
            </div>
        </div>
    );
}
