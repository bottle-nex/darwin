"use client";
import { HiOutlineTag } from "react-icons/hi2";
import { HiMenuAlt2 } from "react-icons/hi";
import { PiColumnsLight } from "react-icons/pi";
import Row from "./SidebarRow";
import Section from "./SidebarSection";
import { type SidebarSectionProps } from "./shared";
import { PlaygroundTab } from "../playgroundTabs";

// The ways you look at the project's work — the board itself and its lenses.
const BOARD_ROWS: { id: string; label: string; icon: React.ComponentType }[] = [
    { id: PlaygroundTab.Kanban, label: "Kanban", icon: PiColumnsLight },
    { id: PlaygroundTab.Gantt, label: "Gantt", icon: HiMenuAlt2 },
    { id: PlaygroundTab.Tags, label: "Tags", icon: HiOutlineTag },
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
