"use client";
import { useEffect } from "react";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { isTyping } from "@/hooks/shortcuts/usePlaygroundShortcuts";
import { Button } from "@/components/ui/button";
import LogoLoader from "@/components/app/LogoLoader";
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

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key !== "Escape" || isTyping(event.target)) return;
            close();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [close]);

    const issue = board?.issues.find((i) => i.id === issueId);

    if (board && issue) {
        return <IssueDetail key={issue.id} issue={issue} columns={board.columns} />;
    }

    return (
        <main className={PLAYGROUND_PANE_SHELL}>
            <div className={PANE_BAR_SHELL}>
                <PlaygroundBreadcrumb />
            </div>
            {!board ? (
                <LogoLoader className="h-full w-full text-snow" />
            ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-y-3">
                    <p className="text-[13px] text-neutral-500">This issue no longer exists.</p>
                    <Button size="xs" variant="tertiary" onClick={close}>
                        Back to board
                    </Button>
                </div>
            )}
        </main>
    );
}
