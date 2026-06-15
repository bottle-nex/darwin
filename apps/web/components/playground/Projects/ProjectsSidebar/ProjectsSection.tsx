"use client";
import { Folder } from "lucide-react";
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
    // The sidebar wraps this section in a motion element for the list/settings
    // cross-fade, which defeats the shell's `peer-empty` "No matches" fallback —
    // so render our own when a search filters everything out.
    if (searching && projects.length === 0) {
        return (
            <p className="truncate px-2 py-8 text-center text-[12px] text-neutral-500">
                No matches for &ldquo;{query.trim()}&rdquo;
            </p>
        );
    }

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
                        // Just switch projects — the active view (Overview / Gantt /
                        // Settings) is kept, mirroring how you'd expect tabs to persist.
                        onClick={() => router.push(`/playground/${orgSlug}/${p.slug}`)}
                    />
                ))}
            </Section>
        </div>
    );
}
