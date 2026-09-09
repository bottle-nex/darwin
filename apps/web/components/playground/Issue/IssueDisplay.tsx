"use client";
import { isAxiosError } from "axios";

import LogoLoader from "@/components/app/LogoLoader";
import { PLAYGROUND_PANE_SHELL } from "@/components/playground/Core/components/paneBar";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import { Button } from "@/components/ui/button";
import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { useIssue } from "@/hooks/issues/useIssue";
import { useEscapeExit } from "@/hooks/shortcuts/useEscapeExit";
import { useActiveProject } from "@/hooks/useActiveProject";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";

import IssueDisplayPane from "./IssueDisplayPane";

export default function IssueDisplay({ issueId }: { issueId: string }) {
    const projectId = useActiveProject()?.id;
    const { data: issue, isPending, isError, error, refetch } = useIssue(projectId, issueId);
    const { data: metadata } = useBoardColumns(projectId);
    const close = usePaneRouteStore((s) => s.openBoard);
    const showsDetail = Boolean(issue);

    useEscapeExit({ enabled: !showsDetail, onExit: close });

    if (issue) {
        return <IssueDisplayPane key={issue.id} issue={issue} columns={metadata?.columns ?? []} />;
    }

    return (
        <main className={PLAYGROUND_PANE_SHELL}>
            <PaneLeadSlot>
                <PlaygroundBreadcrumb />
            </PaneLeadSlot>
            {isPending ? (
                <LogoLoader className="h-full w-full text-overlay" />
            ) : isError && !(isAxiosError(error) && error.response?.status === 404) ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-y-3">
                    <p className="text-[13px] text-neutral-500">This issue could not be loaded.</p>
                    <Button size="xs" variant="tertiary" onClick={() => void refetch()}>
                        Retry
                    </Button>
                </div>
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
