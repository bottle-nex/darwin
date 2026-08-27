"use client";
import { GanttNavIcon, KanbanColumnsIcon, TagIcon } from "@trymatcha/ui/icons";

import { PlaygroundTab } from "../playgroundTabs";
import { type SidebarSectionProps } from "./shared";
import Row from "./SidebarRow";
import Section from "./SidebarSection";

// The ways you look at the project's work — the board itself and its lenses.
const BOARD_ROWS: { id: string; label: string; icon: React.ComponentType }[] = [
    { id: PlaygroundTab.Kanban, label: "Kanban", icon: KanbanColumnsIcon },
    { id: PlaygroundTab.Gantt, label: "Gantt", icon: GanttNavIcon },
    { id: PlaygroundTab.Tags, label: "Tags", icon: TagIcon },
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
                    leading={{ kind: "icon", icon: r.icon }}
                    active={selectedRowId === r.id}
                    onClick={() => onSelect(r.id)}
                />
            ))}
        </Section>
    );
}
