"use client";
import { GanttNavIcon, SpaceEntityIcon, TagIcon } from "@trydarwin/ui/icons";

import HeroBuddy from "@/components/landing/v2/HeroBuddy";

import { PlaygroundTab } from "../playgroundTabs";
import { type SidebarSectionProps } from "./shared";
import Row from "./SidebarRow";
import Section from "./SidebarSection";

type BoardRow = {
    id: string;
    label: string;
    leading: React.ComponentProps<typeof Row>["leading"];
    /** Extra tabs that keep this row lit — one space's board still belongs to Spaces. */
    alsoActiveOn?: string[];
};

// The ways you look at the project's work — the agent's board, the user's own
// boards, and the lenses over both.
const BOARD_ROWS: BoardRow[] = [
    {
        id: PlaygroundTab.Agent,
        label: "Agent",
        leading: { kind: "node", node: <HeroBuddy move={false} className="size-4" /> },
    },
    {
        id: PlaygroundTab.Spaces,
        label: "Spaces",
        leading: { kind: "icon", icon: SpaceEntityIcon },
        alsoActiveOn: [PlaygroundTab.Space],
    },
    { id: PlaygroundTab.Gantt, label: "Gantt", leading: { kind: "icon", icon: GanttNavIcon } },
    { id: PlaygroundTab.Tags, label: "Tags", leading: { kind: "icon", icon: TagIcon } },
];

export default function PlaygroundSidebarBoardSection({
    selectedRowId,
    onSelect,
}: SidebarSectionProps) {
    return (
        <Section title="Board">
            {BOARD_ROWS.map((r) => (
                <Row
                    key={r.id}
                    label={r.label}
                    leading={r.leading}
                    active={
                        selectedRowId === r.id || Boolean(r.alsoActiveOn?.includes(selectedRowId))
                    }
                    onClick={() => onSelect(r.id)}
                />
            ))}
        </Section>
    );
}
