"use client";
import {
    HiOutlineChartBarSquare,
    HiOutlineSquares2X2,
    HiOutlineTag,
    HiOutlineViewColumns,
} from "react-icons/hi2";
import Row from "./SidebarRow";
import Section from "./SidebarSection";
import { type SidebarSectionProps } from "./shared";
import { HomeTab } from "../Home/homeTabs";

// The ways you look at the project's work — the board itself and its lenses.
const BOARD_ROWS: { id: string; label: string; icon: React.ComponentType }[] = [
    { id: HomeTab.Overview, label: "Overview", icon: HiOutlineSquares2X2 },
    { id: HomeTab.Kanban, label: "Kanban", icon: HiOutlineViewColumns },
    { id: HomeTab.Gantt, label: "Gantt", icon: HiOutlineChartBarSquare },
    { id: HomeTab.Tags, label: "Tags", icon: HiOutlineTag },
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
