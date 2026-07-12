"use client";
import { BsFillKanbanFill } from "react-icons/bs";
import { FaInbox, FaAt, FaCheckCircle, FaTags, FaCog } from "react-icons/fa";
import { FaPager } from "react-icons/fa";
import { MdViewTimeline } from "react-icons/md";
import Row from "../../Sidebar/SidebarRow";
import { matchesQuery, type SidebarNavRow, type SidebarSectionProps } from "../../Sidebar/shared";
import { HomeTab } from "../homeTabs";

const PRIMARY_ROWS: { id: string; label: string; icon: React.ComponentType; isLocked?: boolean }[] =
    [
        { id: HomeTab.Overview, label: "Overview", icon: FaPager },
        { id: HomeTab.Kanban, label: "Kanban", icon: BsFillKanbanFill },
        { id: HomeTab.Gantt, label: "Gantt", icon: MdViewTimeline },
        { id: HomeTab.Inbox, label: "Inbox", icon: FaInbox },
        { id: HomeTab.Mentions, label: "Mentions", icon: FaAt },
        { id: HomeTab.Reviews, label: "Reviews", icon: FaCheckCircle },
        { id: HomeTab.Tags, label: "Tags", icon: FaTags },
        { id: HomeTab.SettingsProject, label: "Settings", icon: FaCog },
    ];

export const rows: SidebarNavRow[] = PRIMARY_ROWS.map((r) => ({ id: r.id, label: r.label }));

export default function PlaygroundSidebarPrimaryNavSection({
    selectedRowId,
    onSelect,
    query,
}: SidebarSectionProps) {
    const rows = PRIMARY_ROWS.filter((r) => matchesQuery(r.label, query));
    if (rows.length === 0) return null;

    return (
        <div className="flex flex-col gap-0.5">
            {rows.map((r) => (
                <Row
                    key={r.id}
                    label={r.label}
                    leading={{ kind: "icon", icon: r.icon }}
                    active={selectedRowId === r.id}
                    onClick={() => onSelect(r.id)}
                    isLocked={r.isLocked}
                />
            ))}
        </div>
    );
}
