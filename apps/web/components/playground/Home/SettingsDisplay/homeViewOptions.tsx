"use client";
import {
    AskDarwinIcon,
    ChatsNavIcon,
    GanttNavIcon,
    InboxIcon,
    MyIssuesIcon,
    SpaceEntityIcon,
    TagIcon,
} from "@trydarwin/ui/icons";

import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";

const GLYPH = "size-3.5 text-neutral-400";

/**
 * The views a project can open on, drawn with the sidebar's own marks.
 *
 * Every glyph is the exact one its sidebar row uses — the agent keeps its mascot rather than
 * borrowing a board icon — so the picker and the sidebar name the same place the same way.
 *
 * @example
 * HOME_VIEW_OPTIONS[0]; // { tab: "ask-darwin", label: "Darwin", glyph: <AskDarwinIcon /> }
 */
export const HOME_VIEW_OPTIONS: { tab: PlaygroundTab; label: string; glyph: React.ReactNode }[] = [
    {
        tab: PlaygroundTab.AskDarwin,
        label: "Darwin",
        glyph: <AskDarwinIcon className={GLYPH} aria-hidden />,
    },
    {
        tab: PlaygroundTab.Inbox,
        label: "Inbox",
        glyph: <InboxIcon className={GLYPH} aria-hidden />,
    },
    {
        tab: PlaygroundTab.Chats,
        label: "Chats",
        glyph: <ChatsNavIcon className={GLYPH} aria-hidden />,
    },
    {
        tab: PlaygroundTab.Agent,
        label: "Agent",
        glyph: <HeroBuddy move={false} className="size-3.5" />,
    },
    {
        tab: PlaygroundTab.Spaces,
        label: "Spaces",
        glyph: <SpaceEntityIcon className={GLYPH} aria-hidden />,
    },
    {
        tab: PlaygroundTab.Gantt,
        label: "Gantt",
        glyph: <GanttNavIcon className={GLYPH} aria-hidden />,
    },
    { tab: PlaygroundTab.Tags, label: "Tags", glyph: <TagIcon className={GLYPH} aria-hidden /> },
    {
        tab: PlaygroundTab.AssignedToMe,
        label: "My issues",
        glyph: <MyIssuesIcon className={GLYPH} aria-hidden />,
    },
];
