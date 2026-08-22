"use client";
import type { ReactNode } from "react";
import PriorityCapsule from "@/components/playground/Issue/PriorityCapsule";
import { PRIORITY_OPTIONS } from "@/components/playground/Issue/issueHelpers";
import { PRIORITY_TO_NUMBER } from "../customkanban/data";
import { useIssueActions } from "@/hooks/issues/useIssueActions";
import type { BoardIssue } from "@/types/board";

export default function PriorityChipMenu({
    issueId,
    issue,
    children,
}: {
    issueId: string;
    issue?: BoardIssue;
    children: ReactNode;
}) {
    const { issue: selectedIssue, editable, setPriority } = useIssueActions(issue ?? issueId);
    const value = PRIORITY_OPTIONS.find(
        (option) => PRIORITY_TO_NUMBER[option.value] === selectedIssue?.priority,
    )?.value;

    return (
        <PriorityCapsule
            value={value}
            onChange={setPriority}
            disabled={!editable}
            trigger={
                <button
                    type="button"
                    aria-label="Change priority"
                    disabled={!editable}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                    className="cursor-pointer disabled:cursor-default"
                >
                    {children}
                </button>
            }
        />
    );
}
