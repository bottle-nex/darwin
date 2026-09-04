"use client";
import { useQueryClient } from "@tanstack/react-query";
import { type AgentSession, type RunLogPage } from "@trydarwin/types";

import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import Disclosure from "@/components/playground/Core/components/Disclosure";
import { queryKeyFor } from "@/hooks/runLogs/useRunLogs";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAgentLogsStore } from "@/store/playground/useAgentLogsStore";

import { titleOf } from "./agentLog.registry";
import AgentLogList from "./AgentLogList";
import { toAgentLogRows } from "./agentLogRows";
import CopyLogButton from "./CopyLogButton";

/**
 * The run's log, attached to the activity row that started it.
 *
 * Open until a reader closes it: the log is the account of what the agent did to their code, and
 * it is worth more on the page than the row that would replace it.
 */
export default function AgentLogsActivity({
    session,
    issueId,
}: {
    session: AgentSession;
    issueId?: string;
}) {
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
        <Disclosure
            label="Agent logs"
            className="my-3"
            open={isOpen}
            onOpenChange={(next) => setExpanded(session.id, next)}
            leading={<HeroBuddy move={false} className="size-4 shrink-0" />}
            trailing={
                isOpen && (
                    <CopyLogButton
                        label="Copy the whole log"
                        text={wholeLog}
                        className="absolute top-1/2 right-9 -translate-y-1/2 active:scale-[0.98]"
                    />
                )
            }
        >
            <AgentLogList
                runId={session.id}
                projectId={project.id}
                issueId={issueId}
                canDownload={Boolean(session.logsKey)}
            />
        </Disclosure>
    );
}
