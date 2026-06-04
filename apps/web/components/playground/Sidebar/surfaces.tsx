"use client";

import type { ComponentType } from "react";
import { RailSurface } from "../IconRail/railSurface";
import PlaygroundSidebarAgentsSection, { rows as agentRows } from "./sections/AgentsSection";
import PlaygroundSidebarFavoritesSection from "./sections/FavoritesSection";
import PlaygroundSidebarMyWorkSection, { rows as myWorkRows } from "./sections/MyWorkSection";
import PlaygroundSidebarPrimaryNavSection, {
    rows as primaryNavRows,
} from "./sections/PrimaryNavSection";
import PlaygroundSidebarProjectsSection, { rows as projectRows } from "./sections/ProjectsSection";
import PlaygroundSidebarPullRequestsSection, {
    rows as pullRequestRows,
} from "./sections/PullRequestsSection";
import PlaygroundSidebarTeamsSection, { rows as teamRows } from "./sections/TeamsSection";
import PlaygroundSidebarWorkersSection, { rows as workerRows } from "./sections/WorkersSection";
import { matchesQuery, type SidebarNavRow, type SidebarSectionProps } from "./sections/shared";

/** Header label shown for each surface. */
export const SURFACE_TITLES: Record<RailSurface, string> = {
    [RailSurface.Home]: "Home",
    [RailSurface.Projects]: "Projects",
    [RailSurface.PullRequests]: "Pull Requests",
    [RailSurface.Agents]: "Agents",
    [RailSurface.Workers]: "Workers",
    [RailSurface.More]: "More",
};

// Each section pairs its renderer with the rows it contributes to keyboard
// search navigation — one source so render order and nav order can't drift.
const SECTIONS = {
    primaryNav: { Component: PlaygroundSidebarPrimaryNavSection, rows: primaryNavRows },
    myWork: { Component: PlaygroundSidebarMyWorkSection, rows: myWorkRows },
    favorites: { Component: PlaygroundSidebarFavoritesSection, rows: [] as SidebarNavRow[] },
    projects: { Component: PlaygroundSidebarProjectsSection, rows: projectRows },
    teams: { Component: PlaygroundSidebarTeamsSection, rows: teamRows },
    agents: { Component: PlaygroundSidebarAgentsSection, rows: agentRows },
    pullRequests: { Component: PlaygroundSidebarPullRequestsSection, rows: pullRequestRows },
    workers: { Component: PlaygroundSidebarWorkersSection, rows: workerRows },
} satisfies Record<
    string,
    { Component: ComponentType<SidebarSectionProps>; rows: SidebarNavRow[] }
>;

type SectionKey = keyof typeof SECTIONS;

/** Which sections each surface shows, in order. */
const SURFACE_SECTIONS: Record<RailSurface, SectionKey[]> = {
    [RailSurface.Home]: ["primaryNav", "myWork", "favorites", "projects", "teams", "agents"],
    [RailSurface.Projects]: ["projects", "teams"],
    [RailSurface.PullRequests]: ["pullRequests"],
    [RailSurface.Agents]: ["agents"],
    [RailSurface.Workers]: ["workers"],
    [RailSurface.More]: [],
};

/** Flat, ordered list of navigable rows for the surface, filtered by query. */
export function getSurfaceNavRows(surface: RailSurface, query: string): SidebarNavRow[] {
    return SURFACE_SECTIONS[surface]
        .flatMap((key) => SECTIONS[key].rows)
        .filter((row) => matchesQuery(row.label, query));
}

type PlaygroundSidebarSurfaceProps = {
    surface: RailSurface;
} & SidebarSectionProps;

function SurfaceSections({ surface, ...section }: PlaygroundSidebarSurfaceProps) {
    if (surface === RailSurface.More) {
        return (
            <div className="px-2 py-1 text-[12px] text-neutral-500">More options coming soon</div>
        );
    }
    return (
        <>
            {SURFACE_SECTIONS[surface].map((key) => {
                const { Component } = SECTIONS[key];
                return <Component key={key} {...section} />;
            })}
        </>
    );
}

/**
 * Renders the active surface's sections. Each section filters its own rows by
 * `query` and removes itself when nothing matches — so when the whole list
 * empties out, the `peer-empty` fallback shows the "no matches" message.
 */
export function PlaygroundSidebarSurface(props: PlaygroundSidebarSurfaceProps) {
    return (
        <>
            <div className="peer flex flex-col">
                <SurfaceSections {...props} />
            </div>
            {props.query.trim() && (
                <p className="hidden truncate px-2 py-8 text-center text-[12px] text-neutral-500 peer-empty:block">
                    No matches for &ldquo;{props.query.trim()}&rdquo;
                </p>
            )}
        </>
    );
}
