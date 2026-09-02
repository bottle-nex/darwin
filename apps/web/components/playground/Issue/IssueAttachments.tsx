"use client";
import { FileIcon } from "@trymatcha/ui/icons";

import { useIssueAttempts } from "@/hooks/issues/useIssueAttempts";
import { cn } from "@/lib/utils";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import type { BoardIssue } from "@/types/board";

import IssueCommitsTree from "./IssueCommitsTree";
import { ATTACHMENT_GLYPH, ATTACHMENT_ROW, canReopen } from "./issueHelpers";
import PropertyGroup from "./PropertyGroup";

export default function IssueAttachments({ issue }: { issue: BoardIssue }) {
    const openSolveReport = usePaneRouteStore((s) => s.openSolveReport);
    const { data: attempts } = useIssueAttempts(issue.id);

    const hasReport = attempts?.attempts.some((attempt) => attempt.report) ?? false;
    if (!hasReport && issue.prNumber === null && !canReopen(issue)) return null;

    return (
        <PropertyGroup title="Attachments">
            {hasReport && (
                <button
                    type="button"
                    className={cn(ATTACHMENT_ROW, "cursor-pointer")}
                    onClick={() => openSolveReport(issue.id)}
                >
                    <FileIcon className={cn(ATTACHMENT_GLYPH, "text-neutral-400")} aria-hidden />
                    Solve Report
                </button>
            )}
            <IssueCommitsTree issue={issue} />
        </PropertyGroup>
    );
}
