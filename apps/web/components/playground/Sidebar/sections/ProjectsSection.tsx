"use client";
import { Folder, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Row from "../PlaygroundSidebarRow";
import Section from "../PlaygroundSidebarSection";
import { matchesQuery, type SidebarNavRow, type SidebarSectionProps } from "./shared";

type ProjectColor = "blue" | "yellow" | "emerald" | "red";

const FOLDER_COLOR: Record<ProjectColor, string> = {
    blue: "fill-indigo-700 text-indigo-700",
    yellow: "fill-yellow-700 text-yellow-700",
    emerald: "fill-emerald-700 text-emerald-700",
    red: "fill-red-700 text-red-700",
};

const PROJECTS: { id: string; name: string; suffix?: string; color: ProjectColor }[] = [
    { id: "trymatcha-web", name: "trymatcha-web", suffix: "Piyush's Org", color: "blue" },
    { id: "trymatcha-api", name: "trymatcha-api", color: "emerald" },
    { id: "trymatcha-docs", name: "trymatcha-docs", color: "yellow" },
    { id: "trymatcha-infra", name: "trymatcha-infra", color: "red" },
];

export const rows: SidebarNavRow[] = PROJECTS.map((p) => ({ id: p.id, label: p.name }));

export default function PlaygroundSidebarProjectsSection({
    selectedRowId,
    onSelect,
    query,
}: SidebarSectionProps) {
    const searching = query.trim().length > 0;
    const projects = PROJECTS.filter((p) => matchesQuery(p.name, query));
    if (searching && projects.length === 0) return null;

    return (
        <div className="mt-3">
            <Section title="Projects">
                {projects.map((p) => (
                    <Row
                        key={p.id}
                        label={p.name}
                        suffix={p.suffix}
                        leading={{
                            kind: "node",
                            node: (
                                <Folder
                                    className={cn("size-3.5", FOLDER_COLOR[p.color])}
                                    aria-hidden
                                />
                            ),
                        }}
                        active={selectedRowId === p.id}
                        onClick={() => onSelect(p.id)}
                    />
                ))}
                {!searching && <Row label="Add Project" leading={{ kind: "icon", icon: Plus }} />}
            </Section>
        </div>
    );
}
