"use client";

import { MoreHorizontal, Plus, Sparkles } from "lucide-react";
import Row from "../../Sidebar/SidebarRow";
import Section from "../../Sidebar/SidebarSection";
import {
    PlaygroundSidebarRowAction,
    PlaygroundSidebarSectionAddButton,
    matchesQuery,
    rowLeading,
    type LeadingSpec,
    type SidebarNavRow,
    type SidebarSectionProps,
} from "../../Sidebar/shared";

// Configured LLM agents. "All Runs" surfaces every run; child rows are
// individual agents. `hasAddItem` adds an indented quick-add row beneath one.
const AGENTS: {
    id: string;
    name: string;
    suffix?: string;
    leading: LeadingSpec;
    hasAddItem?: boolean;
}[] = [
    {
        id: "all-runs",
        name: "All Runs",
        suffix: "Piyush's Org",
        leading: { kind: "icon", icon: Sparkles },
    },
    {
        id: "prod-agent",
        name: "Production Agent",
        leading: { kind: "avatar", letter: "P", tone: "indigo" },
        hasAddItem: true,
    },
    {
        id: "staging-agent",
        name: "Staging Agent",
        leading: { kind: "avatar", letter: "S", tone: "blue" },
    },
];

export const rows: SidebarNavRow[] = AGENTS.map((a) => ({ id: a.id, label: a.name }));

export default function PlaygroundSidebarAgentsSection({
    selectedRowId,
    onSelect,
    query,
}: SidebarSectionProps) {
    const searching = query.trim().length > 0;
    const agents = AGENTS.filter((a) => matchesQuery(a.name, query));
    if (searching && agents.length === 0) return null;

    return (
        <div className="mt-3">
            <Section
                title="Agents"
                action={<PlaygroundSidebarSectionAddButton label="New agent" />}
            >
                {agents.map((a) => (
                    <div key={a.id}>
                        <Row
                            label={a.name}
                            suffix={a.suffix}
                            leading={rowLeading(a.leading)}
                            active={selectedRowId === a.id}
                            onClick={() => onSelect(a.id)}
                            trailing={
                                <>
                                    <PlaygroundSidebarRowAction>
                                        <MoreHorizontal className="size-3.5" aria-hidden />
                                    </PlaygroundSidebarRowAction>
                                    <PlaygroundSidebarRowAction>
                                        <Plus className="size-3.5" aria-hidden />
                                    </PlaygroundSidebarRowAction>
                                </>
                            }
                        />
                        {a.hasAddItem && !searching && (
                            <Row
                                indent={1}
                                label="Add task"
                                leading={{ kind: "icon", icon: Plus }}
                            />
                        )}
                    </div>
                ))}
                {!searching && <Row label="New Agent" leading={{ kind: "icon", icon: Plus }} />}
            </Section>
        </div>
    );
}
