"use client";
import { type AgentSession, AgentSessionStatus } from "@trymatcha/types";
import { DropdownCaretIcon } from "@trymatcha/ui/icons";
import { useMemo, useState } from "react";

import { flattenActivityPages } from "@/hooks/activity/activityCache";
import { useActivity } from "@/hooks/activity/useActivity";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";

import RunLogStream from "./RunLogStream";

function latestSession(sessions: (AgentSession | null | undefined)[]): AgentSession | null {
    let latest: AgentSession | null = null;
    for (const session of sessions) {
        if (!session) continue;
        if (!latest || session.attemptNumber >= latest.attemptNumber) latest = session;
    }
    return latest;
}

export default function RunLogPanel({ issueId }: { issueId: string }) {
    const project = useActiveProject();
    const { data } = useActivity(issueId);
    const [openedRunId, setOpenedRunId] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    const session = useMemo(() => {
        if (!data) return null;
        return latestSession(flattenActivityPages(data.pages).map((entry) => entry.session));
    }, [data]);

    if (session && session.id !== openedRunId) {
        setOpenedRunId(session.id);
        setExpanded(session.status === AgentSessionStatus.Running);
    }

    if (!session || !project) return null;

    const running = session.status === AgentSessionStatus.Running;

    return (
        <section className="overflow-hidden rounded-md border border-edge bg-charcoal">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-snow/4"
            >
                <DropdownCaretIcon
                    className={cn(
                        "size-3 shrink-0 text-neutral-500 transition-transform",
                        !expanded && "-rotate-90",
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

            {expanded && (
                <RunLogStream
                    runId={session.id}
                    projectId={project.id}
                    canDownload={Boolean(session.logsKey)}
                />
            )}
        </section>
    );
}
