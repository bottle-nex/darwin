"use client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Markdown from "@/components/utility/Markdown";
import { useSolveReports } from "@/hooks/issues/useSolveReports";
import { shortDate } from "@/lib/format";
import { useSolveReportStore } from "@/store/playground/useSolveReportStore";

/**
 * Every run's account of how it solved the issue, oldest first.
 *
 * A reopened issue runs again, and the earlier attempt's report is often the reason the later
 * one worked — so runs stack here rather than replacing one another.
 */
export default function SolveReportSheet() {
    const issueId = useSolveReportStore((state) => state.issueId);
    const close = useSolveReportStore((state) => state.close);
    const { data: reports, isPending } = useSolveReports(issueId ?? undefined);

    return (
        <Sheet open={Boolean(issueId)} onOpenChange={(next) => !next && close()}>
            <SheetContent
                side="right"
                className="top-3 right-3 bottom-3 h-auto w-140 max-w-[calc(100%-1.5rem)] gap-0 overflow-y-auto rounded-2xl border border-white/5 text-neutral-100 shadow-xl will-change-transform ease-[cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:duration-200 data-[state=open]:duration-300"
            >
                <SheetHeader className="gap-1 px-5 py-4">
                    <SheetTitle className="text-[13px] font-semibold text-neutral-100">
                        How this was solved
                    </SheetTitle>
                    <p className="text-[12px] text-neutral-500">
                        Written by the agent at the end of each run.
                    </p>
                </SheetHeader>

                <div className="px-5 pb-6">
                    {isPending ? (
                        <p className="text-[12px] text-neutral-500">Loading…</p>
                    ) : !reports?.length ? (
                        <p className="text-[12px] text-neutral-500">
                            No run has written a report for this issue yet.
                        </p>
                    ) : (
                        reports.map((entry) => (
                            <section
                                key={entry.id}
                                className="border-t border-white/5 pt-5 first:border-t-0 first:pt-0 [&+section]:mt-6"
                            >
                                <p className="mb-3 text-[11px] tracking-wide text-neutral-500 uppercase">
                                    Attempt {entry.attemptNumber} · {shortDate(entry.startedAt)}
                                    {entry.model ? ` · ${entry.model}` : ""}
                                </p>
                                <Markdown>{entry.report}</Markdown>
                            </section>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
