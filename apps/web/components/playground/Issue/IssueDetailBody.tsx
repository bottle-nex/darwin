"use client";
import { cn } from "@/lib/utils";
import IssueTitleField from "./IssueTitleField";
import IssueBody from "./IssueBody";
import ActivityFeed from "./activity/ActivityFeed";
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
    return (
        <div
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
                <div className="h-px w-full bg-snow/7" />
                <ActivityFeed issueId={issueId} />
            </div>
        </div>
    );
}
