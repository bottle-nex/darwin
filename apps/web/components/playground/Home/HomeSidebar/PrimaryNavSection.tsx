"use client";
import { BsFillKanbanFill } from "react-icons/bs";
import { FaInbox, FaAt, FaCheckCircle, FaTags, FaCog } from "react-icons/fa";
import Row from "../../Sidebar/SidebarRow";
import { matchesQuery, type SidebarNavRow, type SidebarSectionProps } from "../../Sidebar/shared";

const PRIMARY_ROWS: { id: string; label: string; icon: React.ComponentType; isLocked?: boolean }[] =
    [
        { id: "kanban", label: "Kanban", icon: BsFillKanbanFill },
        { id: "inbox", label: "Inbox", icon: FaInbox },
        { id: "mentions", label: "Mentions", icon: FaAt },
        { id: "reviews", label: "Reviews", icon: FaCheckCircle },
        { id: "tags", label: "Tags", icon: FaTags },
        { id: "setup", label: "Setup", icon: FaCog },
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
