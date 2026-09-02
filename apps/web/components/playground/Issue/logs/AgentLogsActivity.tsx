"use client";
import { useQueryClient } from "@tanstack/react-query";
import { type AgentSession, type RunLogPage } from "@trymatcha/types";
import { DropdownCaretIcon } from "@trymatcha/ui/icons";
import { AnimatePresence, motion } from "motion/react";

import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import { queryKeyFor } from "@/hooks/runLogs/useRunLogs";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import { useAgentLogsStore } from "@/store/playground/useAgentLogsStore";

import { titleOf } from "./agentLog.registry";
import AgentLogList from "./AgentLogList";
import { toAgentLogRows } from "./agentLogRows";
import CopyLogButton from "./CopyLogButton";

const PANEL_SPRING = { type: "spring", stiffness: 300, damping: 34, mass: 0.9 } as const;

/**
 * The run's log, attached to the activity row that started it.
 *
 * Open until a reader closes it: the log is the account of what the agent did to their code, and
 * it is worth more on the page than the row that would replace it.
 */
export default function AgentLogsActivity({ session }: { session: AgentSession }) {
    const project = useActiveProject();
    const expanded = useAgentLogsStore((state) => state.expanded[session.id]);
    const setExpanded = useAgentLogsStore((state) => state.setExpanded);

    const queryClient = useQueryClient();

    const isOpen = expanded ?? true;

    // Read at click time rather than through the hook: subscribing here too would send a second
    // socket subscribe for the same run, and unmounting either side would unsubscribe both.
    function wholeLog() {
        const page = queryClient.getQueryData<RunLogPage>(queryKeyFor(session.id));
        return toAgentLogRows(page?.events ?? [])
            .map((event) => titleOf(event))
            .join("\n");
    }

    if (!project) return null;

    return (
        <section className="my-3 overflow-hidden rounded-[8px] border border-snow/3 bg-graphite/40">
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setExpanded(session.id, !isOpen)}
                    aria-expanded={isOpen}
                    className="group flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left"
                >
                    <HeroBuddy move={false} className="size-4 shrink-0" />
                    <span className="text-[12px] font-medium text-snow/50 transition-colors group-hover:text-snow/70">
                        Agent logs
                    </span>
                    <DropdownCaretIcon
                        className={cn(
                            "ml-auto size-4 shrink-0 text-neutral-500 transition-transform",
                            isOpen && "-rotate-180",
                        )}
                        aria-hidden
                    />
                </button>
                {isOpen && (
                    <CopyLogButton
                        label="Copy the whole log"
                        text={wholeLog}
                        className="absolute top-1/2 right-9 -translate-y-1/2 active:scale-[0.98]"
                    />
                )}
            </div>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="logs"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={PANEL_SPRING}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-snow/3">
                            <AgentLogList
                                runId={session.id}
                                projectId={project.id}
                                canDownload={Boolean(session.logsKey)}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
