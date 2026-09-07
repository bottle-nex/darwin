"use client";
import { useState } from "react";

import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import ParticleSphere from "@/components/rishi/ParticleSphere";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";

import DarwinComposer from "./DarwinComposer";

type DarwinMessage = {
    id: number;
    text: string;
};

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
    const user = useUserSessionStore((state) => state.session?.user);
    const [greeting] = useState(timeOfDayGreeting);
    const [messages, setMessages] = useState<DarwinMessage[]>([]);

    const name = user?.name?.trim() || user?.email?.split("@")[0] || "there";

    function send(text: string) {
        setMessages((current) => [...current, { id: current.length + 1, text }]);
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <PaneLeadSlot>
                <PlaygroundBreadcrumb />
            </PaneLeadSlot>
            <section className="relative min-h-0 flex-1 bg-linear-to-b">
                <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pt-20">
                    <DarwinComposer onSend={send} className="w-full max-w-180 shrink-0" />
                    <ul className="mt-4 grid w-full max-w-180 grid-cols-3 gap-3">
                        {BASE_PROMPTS.map((base) => (
                            <li key={base.title}>
                                <button
                                    type="button"
                                    onClick={() => send(base.prompt)}
                                    className="top-lit-edge relative flex h-full w-full cursor-pointer flex-col gap-1.5 rounded-2xl bg-white/2 p-4 text-left transition-colors hover:bg-white/4"
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
                </div>
            </section>
        </div>
    );
}
