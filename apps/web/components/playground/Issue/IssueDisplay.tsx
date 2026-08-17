"use client";
import { useEffect } from "react";
import { BsChatRightText } from "react-icons/bs";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { isTyping } from "@/hooks/shortcuts/usePlaygroundShortcuts";
import { useIssueChatPanelStore } from "@/store/issues/useIssueChatPanelStore";
import { Button } from "@/components/ui/button";
import LogoLoader from "@/components/app/LogoLoader";
import OptionButton from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/OptionButton";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import {
    PANE_BAR_SHELL,
    PLAYGROUND_PANE_SHELL,
} from "@/components/playground/Core/components/paneBar";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { useIssueRoute } from "./useIssueRoute";
import IssueDetail from "./IssueDetail";

export default function IssueDisplay({ issueId }: { issueId: string }) {
    const projectId = useActiveProject()?.id;
    const { data: board } = useBoard(projectId);
    const { close } = useIssueRoute();
    const chatOpen = useIssueChatPanelStore((s) => s.isOpen);
    const toggleChat = useIssueChatPanelStore((s) => s.toggle);

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key !== "Escape" || isTyping(event.target)) return;
            close();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [close]);

    const issue = board?.issues.find((i) => i.id === issueId);

    return (
        <main className={PLAYGROUND_PANE_SHELL}>
            <div className={PANE_BAR_SHELL}>
                <PlaygroundBreadcrumb issueNumber={issue?.number} />
                {issue && (
                    <TooltipComponent
                        delayDuration={1000}
                        content="Comments and activity"
                        side="bottom"
                    >
                        <OptionButton
                            label="Comments and activity"
                            icon={BsChatRightText}
                            active={chatOpen}
                            onClick={toggleChat}
                        />
                    </TooltipComponent>
                )}
            </div>
            {!board ? (
                <LogoLoader className="h-full w-full text-snow" />
            ) : !issue ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-y-3">
                    <p className="text-[13px] text-neutral-500">This issue no longer exists.</p>
                    <Button size="xs" variant="tertiary" onClick={close}>
                        Back to board
                    </Button>
                </div>
            ) : (
                <IssueDetail key={issue.id} issue={issue} columns={board.columns} />
            )}
        </main>
    );
}
