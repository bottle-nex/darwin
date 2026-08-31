"use client";
import { ComposeIssueIcon } from "@trymatcha/ui/icons";

import { Button } from "@/components/ui/button";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useCreateIssueStore } from "@/store/issues/useCreateIssueStore";

import { SIDEBAR_ICON_BUTTON_CLASS } from "./shared";

export default function SidebarActions() {
    const activeProject = useActiveProject();
    const openCreate = useCreateIssueStore((state) => state.open);

    return (
        <div className="flex shrink-0 items-center gap-0.5">
            <TooltipComponent content="Create issue" side="bottom" delayDuration={500}>
                <Button
                    variant="unstyled"
                    type="button"
                    disabled={!activeProject}
                    onClick={() => openCreate({ board: "llm" })}
                    aria-label="Create issue"
                    className={SIDEBAR_ICON_BUTTON_CLASS}
                >
                    <ComposeIssueIcon className="size-3.5" aria-hidden />
                </Button>
            </TooltipComponent>
        </div>
    );
}
