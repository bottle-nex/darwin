"use client";
import {
    HiOutlineAtSymbol,
    HiOutlineChartBarSquare,
    HiOutlineCheckCircle,
    HiOutlineCog6Tooth,
    HiOutlineInbox,
    HiOutlineSquares2X2,
    HiOutlineTag,
    HiOutlineViewColumns,
} from "react-icons/hi2";
import Row from "./SidebarRow";
import { type SidebarSectionProps } from "./shared";
import { HomeTab } from "../Home/homeTabs";

const PRIMARY_ROWS: { id: string; label: string; icon: React.ComponentType; isLocked?: boolean, size?: number }[] =
    [
        { id: HomeTab.Overview, label: "Overview", icon: HiOutlineSquares2X2 },
        { id: HomeTab.Kanban, label: "Kanban", icon: HiOutlineViewColumns },
        { id: HomeTab.Gantt, label: "Gantt", icon: HiOutlineChartBarSquare },
        { id: HomeTab.Inbox, label: "Inbox", icon: HiOutlineInbox },
        { id: HomeTab.Mentions, label: "Mentions", icon: HiOutlineAtSymbol },
        { id: HomeTab.Reviews, label: "Reviews", icon: HiOutlineCheckCircle, size: 4 },
        { id: HomeTab.Tags, label: "Tags", icon: HiOutlineTag },
        { id: HomeTab.SettingsProject, label: "Settings", icon: HiOutlineCog6Tooth },
    ];

export default function PlaygroundSidebarPrimaryNavSection({
    selectedRowId,
    onSelect,
}: SidebarSectionProps) {
    return (
        <div className="flex flex-col gap-0.5">
            {PRIMARY_ROWS.map((r) => (
                <Row
                    key={r.id}
                    label={r.label}
                    leading={{ kind: "icon", icon: r.icon }}
                    active={selectedRowId === r.id}
                    onClick={() => onSelect(r.id)}
                    isLocked={r.isLocked}
                    size={r.size}
                />
            ))}
        </div>
    );
}
