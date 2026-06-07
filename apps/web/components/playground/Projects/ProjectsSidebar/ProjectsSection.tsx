"use client";
import { Folder, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Row from "../../Sidebar/SidebarRow";
import Section from "../../Sidebar/SidebarSection";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { matchesQuery, type SidebarNavRow, type SidebarSectionProps } from "../../Sidebar/shared";

const DEFAULT_FOLDER_COLOR = "#6366f1";

// Projects are fetched per-org at render time, so they can't be listed statically
// for keyboard-search navigation (mirrors the dynamic Favorites section).
export const rows: SidebarNavRow[] = [];

export default function PlaygroundSidebarProjectsSection({ query }: SidebarSectionProps) {
    const router = useRouter();
    const { orgSlug, projectSlug } = useParams<{
        orgSlug: string;
        projectSlug?: string;
    }>();
    const { data: dashboard } = useGetDashboard(orgSlug);

    const searching = query.trim().length > 0;
    const projects = (dashboard?.projects ?? []).filter((p) => matchesQuery(p.name, query));
    if (searching && projects.length === 0) return null;

    return (
        <div className="mt-3">
            <Section title="Projects">
                {projects.map((p) => (
                    <Row
                        key={p.id}
                        label={p.name}
                        leading={{
                            kind: "node",
                            node: (
                                <Folder
                                    className="size-3.5"
                                    style={{
                                        color: p.color ?? DEFAULT_FOLDER_COLOR,
                                        fill: p.color ?? DEFAULT_FOLDER_COLOR,
                                    }}
                                    aria-hidden
                                />
                            ),
                        }}
                        active={p.slug === projectSlug}
                        onClick={() => router.push(`/playground/${orgSlug}/${p.slug}`)}
                    />
                ))}
                {!searching && <Row label="Add Project" leading={{ kind: "icon", icon: Plus }} />}
            </Section>
        </div>
    );
}
