"use client";
import { FileIcon } from "@trymatcha/ui/icons";

import { useIssueAttempts } from "@/hooks/issues/useIssueAttempts";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import type { BoardIssue } from "@/types/board";

import { CapsuleTrigger } from "./Capsule";
import { STACKED_CAPSULE } from "./issueHelpers";
import PropertyGroup from "./PropertyGroup";

export default function IssueAttachments({ issue }: { issue: BoardIssue }) {
    const openSolveReport = usePaneRouteStore((s) => s.openSolveReport);
    const { data } = useIssueAttempts(issue.id);

    const hasReport = data?.attempts.some((attempt) => attempt.report) ?? false;
    if (!hasReport) return null;

    return (
        <PropertyGroup title="Attachments">
            <CapsuleTrigger className={STACKED_CAPSULE} onClick={() => openSolveReport(issue.id)}>
                <FileIcon className="size-3.75! text-neutral-400" />
                Solve Report
            </CapsuleTrigger>
        </PropertyGroup>
    );
}
