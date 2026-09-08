"use client";
import { FileIcon } from "@trydarwin/ui/icons";

import { PLAYGROUND_PANE_SHELL } from "@/components/playground/Core/components/paneBar";
import PaneColumns from "@/components/playground/Core/components/PaneColumns";
import PaneFallback from "@/components/playground/Core/components/PaneFallback";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import { Button } from "@/components/ui/button";
import Markdown from "@/components/utility/Markdown";
import { useIssue } from "@/hooks/issues/useIssue";
import { useIssueAttempts } from "@/hooks/issues/useIssueAttempts";
import { useEscapeExit } from "@/hooks/shortcuts/useEscapeExit";
import { useActiveProject } from "@/hooks/useActiveProject";
import { shortDate } from "@/lib/format";
import type { PaneRoute } from "@/store/playground/usePaneRouteStore";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";

import ReadOnlyIssueProperties from "./ReadOnlyIssueProperties";

type SolveReportRoute = Extract<PaneRoute, { kind: "solve-report" }>;

/**
 * Every run's account of how it solved this issue, oldest first.
 *
 * A reopened issue runs again, and the earlier attempt's dead ends are often the reason the
 * later one worked — so runs stack down the page rather than replacing one another.
 */
export default function SolveReportDisplay({ route }: { route: SolveReportRoute }) {
    const projectId = useActiveProject()?.id;
    const openIssue = usePaneRouteStore((s) => s.openIssue);
    const openBoard = usePaneRouteStore((s) => s.openBoard);
    const { data: issue, isPending: issuePending } = useIssue(projectId, route.issueId);
    const { data: attempts, isPending: attemptsPending } = useIssueAttempts(route.issueId);

    useEscapeExit({ onExit: () => (issue ? openIssue(issue.id) : openBoard()) });

    if (issuePending || attemptsPending) return <PaneFallback />;

    if (!issue) {
        return (
            <PaneFallback>
                <p className="text-[14.5px] text-neutral-500">This issue is no longer available.</p>
                <Button size="xs" variant="tertiary" onClick={openBoard}>
                    Back to board
                </Button>
            </PaneFallback>
        );
    }

    const reported = (attempts?.attempts ?? []).filter(
        (attempt): attempt is typeof attempt & { report: string } => Boolean(attempt.report),
    );

    return (
        <main className={PLAYGROUND_PANE_SHELL}>
            <PaneLeadSlot>
                <PlaygroundBreadcrumb
                    issue={issue}
                    trailing="Solve Report"
                    trailingIcon={FileIcon}
                />
            </PaneLeadSlot>

            <PaneColumns aside={<ReadOnlyIssueProperties issueId={issue.id} />}>
                <div
                    data-lenis-prevent
                    className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-8 py-12"
                >
                    {!reported.length ? (
                        <p className="text-[13.25px] text-neutral-500">
                            No run has written a report for this issue yet.
                        </p>
                    ) : (
                        reported.map((entry) => (
                            <section
                                key={entry.id}
                                className="border-t border-white/5 pt-8 first:border-t-0 first:pt-0 [&+section]:mt-10"
                            >
                                <p className="mb-4 text-[11px] tracking-wide text-neutral-500 uppercase">
                                    Attempt {entry.attemptNumber} · {shortDate(entry.startedAt)}
                                    {entry.model ? ` · ${entry.model}` : ""}
                                </p>
                                {entry.reopenedBy && (
                                    <p className="mb-4 border-l border-white/10 pl-3 text-[13px] text-neutral-400">
                                        Reopened by {entry.reopenedBy.actorName ?? "someone"} —{" "}
                                        {entry.reopenedBy.note}
                                    </p>
                                )}
                                <Markdown>{entry.report}</Markdown>
                            </section>
                        ))
                    )}
                </div>
            </PaneColumns>
        </main>
    );
}
