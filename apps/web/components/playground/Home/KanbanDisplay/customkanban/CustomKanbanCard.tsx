"use client";
import { useState } from "react";

import { useIssueSelection } from "@/hooks/issues/useIssueSelection";
import { useCustomCardActions } from "@/hooks/kanban/useCustomCardActions";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import type { CustomCard } from "@/types/kanban-custom";

import IssueCardFace, { issueIdentifier } from "../cards/IssueCardFace";
import { CARD_SHELL } from "../cardStyles";
import IssueDropdown from "../IssueDropdown";
import AssigneePicker from "./AssigneePicker";

type CustomKanbanCardProps = {
    card: CustomCard;
    preview?: boolean;
};

export default function CustomKanbanCard({ card, preview = false }: CustomKanbanCardProps) {
    const project = useActiveProject();
    const projectId = project?.id;
    const { assignMember, unassignMember, pendingAssigneeId } = useCustomCardActions(card.id);
    const [assignOpen, setAssignOpen] = useState(false);
    const canAssign = Boolean(projectId) && !preview;
    const openIssue = usePaneRouteStore((s) => s.openIssue);
    const { isSelected, handleSelectClick } = useIssueSelection("custom-kanban");
    const selected = !preview && isSelected(card.id);

    const face = (
        <div
            data-issue-id={preview ? undefined : card.id}
            data-selection-scope={preview ? undefined : "custom-kanban"}
            data-selected={selected}
            className="group/card"
        >
            <div className={cn(CARD_SHELL, "relative")}>
                <div
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={(event) => {
                        if (!preview && handleSelectClick(event, card.id)) return;
                        openIssue(card.id);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openIssue(card.id);
                        }
                    }}
                >
                    <IssueCardFace
                        identifier={issueIdentifier(project?.name, card.number ?? "")}
                        issueId={preview ? undefined : card.id}
                        boardIssue={card.boardIssue}
                        title={card.title}
                        status={card.status}
                        priority={card.priority}
                        tags={card.tags}
                        targetDate={card.targetDate}
                        createdAt={card.createdAt}
                        assignees={card.assignees}
                        onAssigneesClick={canAssign ? () => setAssignOpen(true) : undefined}
                    />
                </div>

                {canAssign && projectId && (
                    <AssigneePicker
                        open={assignOpen}
                        onOpenChange={setAssignOpen}
                        projectId={projectId}
                        assignees={card.assignees}
                        onAssign={assignMember}
                        onUnassign={unassignMember}
                        pendingAssigneeId={pendingAssigneeId}
                    />
                )}
            </div>
        </div>
    );

    if (preview) return face;
    return (
        <IssueDropdown issueId={card.id} issue={card.boardIssue}>
            {face}
        </IssueDropdown>
    );
}
