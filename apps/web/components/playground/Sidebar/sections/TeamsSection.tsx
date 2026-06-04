"use client";

import { UserPlus } from "lucide-react";
import Row from "../PlaygroundSidebarRow";
import Section from "../PlaygroundSidebarSection";
import {
    matchesQuery,
    rowLeading,
    type LeadingSpec,
    type SidebarNavRow,
    type SidebarSectionProps,
} from "./shared";

// Org-level groupings that own projects and issues.
const TEAMS: { id: string; name: string; suffix?: string; leading: LeadingSpec }[] = [
    {
        id: "team-frontend",
        name: "Frontend",
        leading: { kind: "avatar", letter: "F", tone: "indigo" },
    },
    { id: "team-backend", name: "Backend", leading: { kind: "avatar", letter: "B", tone: "dark" } },
];

export const rows: SidebarNavRow[] = TEAMS.map((t) => ({ id: t.id, label: t.name }));

export default function PlaygroundSidebarTeamsSection({
    selectedRowId,
    onSelect,
    query,
}: SidebarSectionProps) {
    const searching = query.trim().length > 0;
    const rows = TEAMS.filter((t) => matchesQuery(t.name, query));
    if (searching && rows.length === 0) return null;

    return (
        <div className="mt-3">
            <Section title="Teams">
                {rows.map((t) => (
                    <Row
                        key={t.id}
                        label={t.name}
                        suffix={t.suffix}
                        leading={rowLeading(t.leading)}
                        active={selectedRowId === t.id}
                        onClick={() => onSelect(t.id)}
                    />
                ))}
                {!searching && (
                    <Row label="Invite to team" leading={{ kind: "icon", icon: UserPlus }} />
                )}
            </Section>
        </div>
    );
}
