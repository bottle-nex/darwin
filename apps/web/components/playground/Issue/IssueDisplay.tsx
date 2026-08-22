"use client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useBoard } from "@/hooks/issues/useBoard";
import { useEscapeExit } from "@/hooks/shortcuts/useEscapeExit";
import { Button } from "@/components/ui/button";
import LogoLoader from "@/components/app/LogoLoader";
import { PLAYGROUND_PANE_SHELL } from "@/components/playground/Core/components/paneBar";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { useIssueNavigation } from "./useIssueNavigation";
import IssueDisplayPane from "./IssueDisplayPane";

export default function IssueDisplay({ issueId }: { issueId: string }) {
    const projectId = useActiveProject()?.id;
    const { data: board } = useBoard(projectId);
    const { close } = useIssueNavigation();

    const issue = board?.issues.find((i) => i.id === issueId);
    const showsDetail = Boolean(board && issue);

    useEscapeExit({ enabled: !showsDetail, onExit: close });

    if (board && issue) {
        return <IssueDisplayPane key={issue.id} issue={issue} columns={board.columns} />;
    }

    return (
        <main className={PLAYGROUND_PANE_SHELL}>
            <PaneLeadSlot>
                <PlaygroundBreadcrumb />
            </PaneLeadSlot>
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
