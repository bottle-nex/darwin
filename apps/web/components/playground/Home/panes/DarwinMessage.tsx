"use client";
import type { DarwinResource, DarwinUiMessage } from "@trydarwin/types";

import Markdown from "@/components/utility/Markdown";

import DarwinResourceBlock from "./darwin/DarwinResourceBlock";
import DarwinSteps from "./darwin/DarwinSteps";

type DarwinMessageProps = {
    message: DarwinUiMessage;
};

/**
 * The identity a card is deduplicated by.
 *
 * A turn that reads issue #142 and then updates it produced two cards for one issue, and two
 * narrowing searches produced two lists where only the last one answers the question. Keeping the
 * last per identity stops an answer becoming a scrapbook of its own working.
 */
function resourceKey(resource: DarwinResource): string {
    if (resource.kind === "issue") return `issue:${resource.item.id}`;
    if (resource.kind === "board_item") return `board_item:${resource.id}`;
    if (resource.kind === "comment") return `comment:${resource.issueNumber}`;
    return resource.kind;
}

/** Last card per identity, in the order the steps ran. */
export function darwinResourcesOf(tools: DarwinUiMessage["tools"]) {
    const byKey = new Map<string, DarwinResource>();
    for (const step of tools) {
        if (step.resource) byKey.set(resourceKey(step.resource), step.resource);
    }
    return [...byKey.entries()];
}

/**
 * One turn in the thread.
 *
 * The user's own words sit in a tinted bubble on the right; Darwin's answer runs full width with
 * no bubble, because an answer is usually several paragraphs and a bubble makes it read as a chat
 * aside rather than a piece of work.
 *
 * Steps, then the answer, then what it found — the prose reads as a caption for the cards below it.
 */
export default function DarwinMessage({ message }: DarwinMessageProps) {
    if (message.role === "user") {
        return (
            <div className="flex justify-end">
                <p className="max-w-[80%] surface-card rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap text-neutral-100">
                    {message.content}
                </p>
            </div>
        );
    }

    const resources = darwinResourcesOf(message.tools);

    return (
        <div className="flex flex-col gap-3">
            <DarwinSteps steps={message.tools} />

            {message.content && (
                <div className="text-[14px] text-neutral-200">
                    <Markdown>{message.content}</Markdown>
                </div>
            )}

            {resources.map(([key, resource]) => (
                <DarwinResourceBlock key={key} resource={resource} />
            ))}
        </div>
    );
}
