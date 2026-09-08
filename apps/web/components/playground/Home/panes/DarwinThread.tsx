"use client";
import { LoadingSpinnerIcon } from "@trydarwin/ui/icons";
import { useEffect, useRef } from "react";

import type { DarwinThreadView } from "@/hooks/darwin/darwinCache";

import DarwinResourceBlock from "./darwin/DarwinResourceBlock";
import DarwinSteps from "./darwin/DarwinSteps";
import DarwinMessage, { darwinResourcesOf } from "./DarwinMessage";

type DarwinThreadProps = {
    view: DarwinThreadView;
};

/**
 * The conversation, with the in-flight answer pinned to the bottom.
 *
 * Auto-scrolls on every token, but only while the reader is already near the bottom — yanking the
 * viewport back down while someone is re-reading an earlier answer is worse than not following.
 */
export default function DarwinThread({ view }: DarwinThreadProps) {
    const scroller = useRef<HTMLDivElement>(null);
    const live = view.live;
    const tokenCount = live?.text.length ?? 0;

    useEffect(() => {
        const node = scroller.current;
        if (!node) return;
        const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
        if (distanceFromBottom > 160) return;
        node.scrollTop = node.scrollHeight;
    }, [view.messages.length, tokenCount]);

    const thinking = Boolean(view.activeRunId) && !tokenCount;

    return (
        <div ref={scroller} className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-180 flex-col gap-6 py-8">
                {view.messages.map((message) => (
                    <DarwinMessage key={message.id} message={message} />
                ))}

                {live && (live.tools.length > 0 || tokenCount > 0 || thinking) && (
                    <div className="flex flex-col gap-3">
                        <DarwinSteps steps={live.tools} />

                        {thinking && !live.tools.length && (
                            <p className="flex items-center gap-2 text-sm text-neutral-500">
                                <LoadingSpinnerIcon className="size-3.5 animate-spin" aria-hidden />
                                Thinking…
                            </p>
                        )}

                        {/* Plain while streaming: half-arrived markdown flickers as `**bold` opens
                            and closes. It becomes a rendered message the moment the turn settles. */}
                        {tokenCount > 0 && (
                            <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-neutral-200">
                                {live.text}
                            </p>
                        )}

                        {darwinResourcesOf(live.tools).map(([key, resource]) => (
                            <DarwinResourceBlock key={key} resource={resource} />
                        ))}
                    </div>
                )}

                {live?.error && (
                    <p className="text-sm text-red-300" role="alert">
                        {live.error}
                    </p>
                )}
            </div>
        </div>
    );
}
