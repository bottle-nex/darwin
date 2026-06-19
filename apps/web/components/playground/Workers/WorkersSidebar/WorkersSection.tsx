"use client";

import { Plus, Server } from "lucide-react";
import Row from "../../sidebar/SidebarRow";
import Section from "../../sidebar/SidebarSection";
import { matchesQuery, type SidebarNavRow, type SidebarSectionProps } from "../../sidebar/shared";

// Sandboxed compute that clones and runs the target project so agents can
// build, test, and validate before shipping a PR.
const WORKERS: { id: string; name: string; status: string }[] = [
    { id: "worker-prod", name: "prod-worker-1", status: "idle" },
    { id: "worker-staging", name: "staging-worker", status: "building" },
];

export const rows: SidebarNavRow[] = WORKERS.map((w) => ({ id: w.id, label: w.name }));

export default function PlaygroundSidebarWorkersSection({
    selectedRowId,
    onSelect,
    query,
}: SidebarSectionProps) {
    const searching = query.trim().length > 0;
    const rows = WORKERS.filter((w) => matchesQuery(w.name, query));
    if (searching && rows.length === 0) return null;

    return (
        <div className="mt-1">
            <Section title="Workers">
                {rows.map((w) => (
                    <Row
                        key={w.id}
                        label={w.name}
                        suffix={w.status}
                        leading={{ kind: "icon", icon: Server }}
                        active={selectedRowId === w.id}
                        onClick={() => onSelect(w.id)}
                    />
                ))}
                {!searching && <Row label="New Worker" leading={{ kind: "icon", icon: Plus }} />}
            </Section>
        </div>
    );
}
