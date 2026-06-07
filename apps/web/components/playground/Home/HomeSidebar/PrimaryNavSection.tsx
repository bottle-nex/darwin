"use client";
import { AtSign, FileCheck, Inbox, LayoutDashboard, type LucideIcon } from "lucide-react";
import Row from "../../Sidebar/SidebarRow";
import { matchesQuery, type SidebarNavRow, type SidebarSectionProps } from "../../Sidebar/shared";

const PRIMARY_ROWS: { id: string; label: string; icon: LucideIcon }[] = [
    { id: "inbox", label: "Inbox", icon: Inbox },
    { id: "kanban", label: "Kanban", icon: LayoutDashboard },
    { id: "mentions", label: "Mentions", icon: AtSign },
    { id: "reviews", label: "Reviews", icon: FileCheck },
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
                />
            ))}
        </div>
    );
}
