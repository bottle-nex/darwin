"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PlaygroundAvatar, {
    displayNameOf,
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import type { ReferenceSuggestion } from "./referenceMention";

function keyOf(item: ReferenceSuggestion): string {
    return `${item.kind}:${item.id}`;
}

export interface ReferenceSuggestionListHandle {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface ReferenceSuggestionListProps {
    items: ReferenceSuggestion[];
    command: (item: ReferenceSuggestion) => void;
}

function IssueRow({ item }: { item: Extract<ReferenceSuggestion, { kind: "issue" }> }) {
    const { icon: Icon, titleBox } = KanbanBoard.glyphFor(item.issue.status);
    return (
        <>
            <Icon className={cn("size-3.5 shrink-0", titleBox)} />
            <span className="shrink-0 font-medium text-neutral-400">#{item.issue.number}</span>
            <span className="truncate">{item.issue.title}</span>
        </>
    );
}

function MemberRow({ item }: { item: Extract<ReferenceSuggestion, { kind: "member" }> }) {
    const name = displayNameOf(item.member.name, item.member.email);
    return (
        <>
            <PlaygroundAvatar
                letter={name.charAt(0).toUpperCase()}
                src={item.member.image ?? undefined}
                tone={toneFor(item.member.id)}
                size="md"
                className="rounded-full"
            />
            <span className="truncate">{name}</span>
        </>
    );
}

const ReferenceSuggestionList = forwardRef<
    ReferenceSuggestionListHandle,
    ReferenceSuggestionListProps
>(function ReferenceSuggestionList({ items, command }, ref) {
    // Tracked by item identity, not index — a new result set whose selected row
    // is gone simply falls back to the first, with no effect to reset it.
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const found = items.findIndex((item) => keyOf(item) === selectedKey);
    const selected = found === -1 ? 0 : found;

    useImperativeHandle(ref, () => ({
        onKeyDown({ event }) {
            if (!items.length) return false;
            if (event.key === "ArrowDown") {
                setSelectedKey(keyOf(items[(selected + 1) % items.length]));
                return true;
            }
            if (event.key === "ArrowUp") {
                setSelectedKey(keyOf(items[(selected - 1 + items.length) % items.length]));
                return true;
            }
            if (event.key === "Enter" || event.key === "Tab") {
                if (items[selected]) command(items[selected]);
                return true;
            }
            return false;
        },
    }));

    if (!items.length) {
        return (
            <div className="pointer-events-auto w-64 rounded-md border border-white/10 bg-neutral-900 p-2 text-[13px] text-neutral-500 shadow-lg">
                No matches
            </div>
        );
    }

    return (
        <div
            onMouseDown={(event) => event.preventDefault()}
            className="pointer-events-auto flex max-h-56 w-72 flex-col gap-px overflow-y-auto rounded-md border border-white/10 bg-neutral-900 p-1 shadow-lg"
        >
            {items.map((item, index) => (
                <Button
                    variant="unstyled"
                    key={`${item.kind}:${item.id}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => command(item)}
                    onMouseEnter={() => setSelectedKey(keyOf(item))}
                    className={cn(
                        "flex w-full cursor-pointer items-center gap-x-2 rounded-[5px] px-2 py-1.5 text-left text-[13px] text-neutral-200 transition-colors",
                        index === selected ? "bg-white/10" : "hover:bg-white/5",
                    )}
                >
                    {item.kind === "issue" ? <IssueRow item={item} /> : <MemberRow item={item} />}
                </Button>
            ))}
        </div>
    );
});

export default ReferenceSuggestionList;
