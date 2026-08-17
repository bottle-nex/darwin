import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Issue } from "@/types/kanban";
import { CARD_SHELL } from "../cardStyles";
import IssueCardFace, { issueIdentifier } from "./IssueCardFace";

type BaseCardProps = {
    issue: Issue;
    children?: ReactNode;
    className?: string;
};

export default function BaseCard({ issue, children, className }: BaseCardProps) {
    return (
        <div className={cn(CARD_SHELL, className)}>
            <IssueCardFace
                identifier={issueIdentifier(issue.project, issue.number)}
                title={issue.title}
                status={issue.status}
                priority={issue.priority}
                targetDate={issue.targetDate}
                createdAt={issue.createdAt}
                assignees={issue.assignees}
            >
                {children}
            </IssueCardFace>
        </div>
    );
}
