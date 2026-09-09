"use client";
import { useState } from "react";

import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import { useDarwinThread } from "@/hooks/darwin/useDarwinThread";
import { useSendDarwinMessage, useStopDarwinRun } from "@/hooks/darwin/useSendDarwinMessage";
import { useSocketConnection } from "@/hooks/socket/useSocketConnection";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useDarwinThreadStore } from "@/store/playground/useDarwinThreadStore";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";

import DarwinComposer from "./DarwinComposer";
import DarwinThread from "./DarwinThread";

const BASE_PROMPTS = [
    {
        title: "Triage the board",
        prompt: "Which open issues look most urgent, and why?",
    },
    {
        title: "Find blockers",
        prompt: "What is blocking work in progress right now?",
    },
    {
        title: "Draft an issue",
        prompt: "Help me write a clear issue with steps to reproduce.",
    },
];

function timeOfDayGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

export default function AskDarwinDisplay() {
    const project = useActiveProject();
    const user = useUserSessionStore((state) => state.session?.user);
    const threadId = useDarwinThreadStore((state) => state.threadId);
    const openThread = useDarwinThreadStore((state) => state.open);
    const [greeting] = useState(timeOfDayGreeting);

    const isConnected = useSocketConnection(project?.id);
    const thread = useDarwinThread(project?.id, threadId ?? undefined, isConnected);
    const send = useSendDarwinMessage();
    const stop = useStopDarwinRun();

    const name = user?.name?.trim() || user?.email?.split("@")[0] || "there";
    const view = thread.data;
    const runId = view?.activeRunId ?? null;
    const streaming = Boolean(runId);
    const started = Boolean(threadId);

    async function ask(text: string) {
        if (!project?.id || streaming) return;
        const result = await send.mutateAsync({
            project_id: project.id,
            thread_id: threadId ?? undefined,
            message: text,
        });
        if (!threadId) openThread(result.threadId);
    }

    function halt() {
        if (!project?.id || !runId) return;
        stop.mutate({ project_id: project.id, run_id: runId });
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <PaneLeadSlot>
                <PlaygroundBreadcrumb />
            </PaneLeadSlot>

            <section className="relative flex min-h-0 flex-1 flex-col">
                {started && view ? (
                    <DarwinThread view={view} />
                ) : (
                    <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-6">
                        <h1 className="mb-6 text-2xl font-medium text-neutral-100">
                            {greeting}, {name}
                        </h1>
                    </div>
                )}

                <div className="relative z-10 flex shrink-0 flex-col items-center px-6 pb-8">
                    <DarwinComposer
                        onSend={ask}
                        onStop={halt}
                        streaming={streaming}
                        className="w-full max-w-180"
                    />
                    {!started && (
                        <ul className="mt-4 grid w-full max-w-180 grid-cols-3 gap-3">
                            {BASE_PROMPTS.map((base) => (
                                <li key={base.title}>
                                    <button
                                        type="button"
                                        onClick={() => void ask(base.prompt)}
                                        className="surface-card surface-card-interactive top-lit-edge relative flex h-full w-full cursor-pointer flex-col gap-1.5 rounded-2xl p-4 text-left transition-colors"
                                    >
                                        <span className="text-sm font-medium text-neutral-100">
                                            {base.title}
                                        </span>
                                        <span className="text-xs leading-relaxed text-neutral-400">
                                            {base.prompt}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
}
