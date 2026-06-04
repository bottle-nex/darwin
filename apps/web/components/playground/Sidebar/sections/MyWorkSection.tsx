"use client";

import { Clock, FilePen, MoreHorizontal } from "lucide-react";
import Row from "../PlaygroundSidebarRow";
import Section from "../PlaygroundSidebarSection";
import {
    matchesQuery,
    rowLeading,
    type LeadingSpec,
    type SidebarNavRow,
    type SidebarSectionProps,
} from "./shared";

// What the current user owns or is actively driving.
const MY_WORK: { id: string; label: string; badge?: number; leading: LeadingSpec }[] = [
    {
        id: "assigned-to-me",
        label: "Assigned to me",
        leading: { kind: "avatar", letter: "P", tone: "dark" },
    },
    { id: "in-progress", label: "In Progress", badge: 2, leading: { kind: "icon", icon: Clock } },
    { id: "drafts", label: "Drafts", leading: { kind: "icon", icon: FilePen } },
];

export const rows: SidebarNavRow[] = MY_WORK.map((c) => ({ id: c.id, label: c.label }));

export default function PlaygroundSidebarMyWorkSection({
    selectedRowId,
    onSelect,
    query,
}: SidebarSectionProps) {
    const searching = query.trim().length > 0;
    const rows = MY_WORK.filter((c) => matchesQuery(c.label, query));
    if (searching && rows.length === 0) return null;

    return (
        <div className="mt-1">
            <Section title="My Work" variant="inline">
                {rows.map((c) => (
                    <Row
                        key={c.id}
                        indent={1}
                        label={c.label}
                        badge={c.badge}
                        leading={rowLeading(c.leading)}
                        active={selectedRowId === c.id}
                        onClick={() => onSelect(c.id)}
                    />
                ))}
                {!searching && (
                    <Row indent={1} label="More" leading={{ kind: "icon", icon: MoreHorizontal }} />
                )}
            </Section>
        </div>
    );
}
