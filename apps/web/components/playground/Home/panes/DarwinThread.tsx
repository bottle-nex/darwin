"use client";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import type { DarwinThreadView } from "@/hooks/darwin/darwinCache";

import DarwinActivity from "./darwin/DarwinActivity";
import DarwinResourceBlock from "./darwin/DarwinResourceBlock";
import DarwinSteps from "./darwin/DarwinSteps";
import DarwinMessage, { darwinResourcesOf, DarwinUserBubble } from "./DarwinMessage";
import { darwinActivityLabel } from "./darwinToolLabels";

type DarwinThreadProps = {
    view: DarwinThreadView | null;
    pending: string | null;
    failed: string | null;
    onRetry: () => void;
};

/**
 * The conversation, with the in-flight answer pinned to the bottom.
 *
 * Auto-scrolls on every token, but only while the reader is already near the bottom — yanking the
 * viewport back down while someone is re-reading an earlier answer is worse than not following.
 */
export default function DarwinThread({ view, pending, failed, onRetry }: DarwinThreadProps) {
    const scroller = useRef<HTMLDivElement>(null);
    const messages = view?.messages ?? [];
    const live = view?.live ?? null;
    const tokenCount = live?.text.length ?? 0;

    useEffect(() => {
        const node = scroller.current;
        if (!node) return;
        const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
        if (distanceFromBottom > 160) return;
        node.scrollTop = node.scrollHeight;
    }, [messages.length, tokenCount, pending]);

    const working = Boolean(pending) || Boolean(view?.activeRunId);
    const label = pending ? "Sending…" : darwinActivityLabel(live);
    const activity = working && !tokenCount ? label : null;
    const steps = live?.tools ?? [];
    const showTurn =
        steps.length > 0 || tokenCount > 0 || activity !== null || Boolean(!pending && live?.error);

    return (
        <div
            ref={scroller}
            className="no-scrollbar min-h-0 flex-1 overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent_0,black_2rem,black_calc(100%_-_2rem),transparent_100%)]"
        >
            <div className="mx-auto flex w-full max-w-180 flex-col gap-6 py-8">
                {messages.map((message) => (
                    <DarwinMessage key={message.id} message={message} />
                ))}

                {pending && <DarwinUserBubble text={pending} />}

                {showTurn && (
                    <div className="flex flex-col gap-3">
                        <DarwinSteps steps={steps} />

                        {activity !== null && <DarwinActivity label={activity} />}

                        {/* Plain while streaming: half-arrived markdown flickers as `**bold` opens
                            and closes. It becomes a rendered message the moment the turn settles. */}
                        {live && tokenCount > 0 && (
                            <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-neutral-200">
                                {live.text}
                                <span
                                    className="ml-0.5 inline-block h-[1em] w-px translate-y-[0.15em] animate-caret-blink bg-neutral-400 align-baseline"
                                    aria-hidden
                                />
                            </p>
                        )}

                        {darwinResourcesOf(steps).map(([key, resource]) => (
                            <DarwinResourceBlock key={key} resource={resource} />
                        ))}

                        {!pending && live?.error && (
                            <p className="text-sm text-danger" role="alert">
                                {live.error}
                            </p>
                        )}
                    </div>
                )}

                {failed && (
                    <>
                        <DarwinUserBubble text={failed} />
                        <p className="flex items-center gap-3 text-sm text-danger" role="alert">
                            That message did not reach Darwin.
                            <Button
                                variant="unstyled"
                                type="button"
                                onClick={onRetry}
                                className="cursor-pointer text-neutral-300 underline underline-offset-4 transition-colors hover:text-neutral-100"
                            >
                                Retry
                            </Button>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
