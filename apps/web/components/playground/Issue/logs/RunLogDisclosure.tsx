"use client";
import { type AgentSession, AgentSessionStatus } from "@trymatcha/types";
import { DropdownCaretIcon } from "@trymatcha/ui/icons";

import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import { useRunLogDisclosureStore } from "@/store/playground/useRunLogDisclosureStore";

import RunLogStream from "./RunLogStream";

/**
 * The run's log, attached to the activity row that started it.
 *
 * Opens itself while the run is live and stays shut once it has ended: a run in progress is the
 * one a reader came to watch, and an old one is a detail they can ask for.
 */
export default function RunLogDisclosure({ session }: { session: AgentSession }) {
    const project = useActiveProject();
    const expanded = useRunLogDisclosureStore((state) => state.expanded[session.id]);
    const setExpanded = useRunLogDisclosureStore((state) => state.setExpanded);

    const running = session.status === AgentSessionStatus.Running;
    const isOpen = expanded ?? running;

    if (!project) return null;

    return (
        <section className="mt-1.5 overflow-hidden rounded-md border border-edge bg-charcoal">
            <button
                type="button"
                onClick={() => setExpanded(session.id, !isOpen)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-snow/4"
            >
                <DropdownCaretIcon
                    className={cn(
                        "size-3 shrink-0 text-neutral-500 transition-transform",
                        !isOpen && "-rotate-90",
                    )}
                    aria-hidden
                />
                <span className="text-[12.5px] font-medium text-snow/70">Agent logs</span>
                <span className="text-[11.5px] text-snow/35 tabular-nums">
                    attempt {session.attemptNumber}
                </span>
                {running && (
                    <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-matcha">
                        <span className="size-1.5 animate-pulse rounded-full bg-matcha" />
                        live
                    </span>
                )}
            </button>

            {isOpen && (
                <RunLogStream
                    runId={session.id}
                    projectId={project.id}
                    canDownload={Boolean(session.logsKey)}
                />
            )}
        </section>
    );
}
