"use client";

import type { ReactNode } from "react";

import { ISSUE_PAGE_TITLE } from "@/components/command/CommandIssuePage";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { issueFieldKeys } from "@/hooks/shortcuts/issueFieldKeys";
import type { IssueCommandPage } from "@/types/command.type";

export default function IssueFieldTooltip({
    field,
    children,
}: {
    field: IssueCommandPage;
    children: ReactNode;
}) {
    if (field === "tags") return <>{children}</>;

    return (
        <TooltipComponent content={ISSUE_PAGE_TITLE[field]} shortcut={issueFieldKeys(field)}>
            {children}
        </TooltipComponent>
    );
}
