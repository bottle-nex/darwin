"use client";

import { TeamEntityIcon } from "@trydarwin/ui/icons";
import { forwardRef, useImperativeHandle, useState } from "react";

import PlaygroundAvatar, {
    displayNameOf,
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { Button } from "@/components/ui/button";
import { IconPickGlyph } from "@/components/ui/IconPicker";
import { MENU_ITEM, MENU_SURFACE } from "@/components/ui/menuSurface";
import { useIssueIdentifier } from "@/hooks/issues/useIssueIdentifier";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";

import type { ReferenceSuggestion } from "./referenceMention";

const ROW_CLASS = cn(MENU_ITEM, "w-full gap-x-2 text-left");
const PANEL_CLASS = cn(
    MENU_SURFACE,
    "pointer-events-auto flex max-h-56 w-72 flex-col gap-px overflow-y-auto",
);

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
    const identifier = useIssueIdentifier();
    const { icon: Icon, titleBox } = KanbanBoard.glyphFor(item.issue.status);
    return (
        <>
            <Icon className={cn("size-3.5 shrink-0", titleBox)} />
            <span className="shrink-0 font-medium text-neutral-400">
                {identifier(item.issue.number)}
            </span>
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

function TeamRow({ item }: { item: Extract<ReferenceSuggestion, { kind: "team" }> }) {
    return (
        <>
            {item.team.icon ? (
                <IconPickGlyph pick={item.team.icon} className="size-3.5 shrink-0 text-sm" />
            ) : (
                <TeamEntityIcon className="size-3.5 shrink-0 text-neutral-400" />
            )}
            <span className="truncate">{item.team.name}</span>
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
            <div
                className={cn(
                    MENU_SURFACE,
                    "pointer-events-auto w-72 py-6 text-center text-sm text-neutral-500",
                )}
            >
                No matches
            </div>
        );
    }

    return (
        <div
            data-lenis-prevent
            onMouseDown={(event) => event.preventDefault()}
            className={PANEL_CLASS}
        >
            {items.map((item, index) => (
                <Button
                    variant="unstyled"
                    key={`${item.kind}:${item.id}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => command(item)}
                    onMouseEnter={() => setSelectedKey(keyOf(item))}
                    data-selected={index === selected}
                    className={ROW_CLASS}
                >
                    {item.kind === "issue" ? (
                        <IssueRow item={item} />
                    ) : item.kind === "team" ? (
                        <TeamRow item={item} />
                    ) : (
                        <MemberRow item={item} />
                    )}
                </Button>
            ))}
        </div>
    );
});

export default ReferenceSuggestionList;
