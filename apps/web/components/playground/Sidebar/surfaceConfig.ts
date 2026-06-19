import { RailSurface } from "../iconrail/railSurface";
import { rows as primaryNavRows } from "../home/homesidebar/PrimaryNavSection";
import { rows as myWorkRows } from "../home/homesidebar/MyWorkSection";
import { rows as projectRows } from "../projects/projectsidebar/ProjectsSection";
import { rows as teamRows } from "../projects/projectsidebar/TeamsSection";
import { rows as agentRows } from "../agents/agentsidebar/AgentsSection";
import { rows as pullRequestRows } from "../pullrequests/PullRequestsSidebar/PullRequestsSection";
import { rows as workerRows } from "../workers/WorkersSidebar/WorkersSection";
import { matchesQuery, type SidebarNavRow } from "./shared";

/** Header label shown for each surface. */
export const SURFACE_TITLES: Record<RailSurface, string> = {
    [RailSurface.Home]: "Home",
    [RailSurface.Projects]: "Projects",
    [RailSurface.PullRequests]: "Pull Requests",
    [RailSurface.Agents]: "Agents",
    [RailSurface.Workers]: "Workers",
    [RailSurface.More]: "More",
};

// Flat, ordered nav rows per surface — the static rows a surface's sidebar
// shows, in render order. Drives keyboard-search navigation. Dynamic rows
// (projects, teams) contribute empty lists since they can't be pre-listed.
const SURFACE_NAV_ROWS: Record<RailSurface, SidebarNavRow[]> = {
    [RailSurface.Home]: [
        ...primaryNavRows,
        ...myWorkRows,
        ...projectRows,
        ...teamRows,
        ...agentRows,
    ],
    [RailSurface.Projects]: [...projectRows, ...teamRows],
    [RailSurface.PullRequests]: [...pullRequestRows],
    [RailSurface.Agents]: [...agentRows],
    [RailSurface.Workers]: [...workerRows],
    [RailSurface.More]: [],
};

/** Flat, ordered list of navigable rows for the surface, filtered by query. */
export function getSurfaceNavRows(surface: RailSurface, query: string): SidebarNavRow[] {
    return SURFACE_NAV_ROWS[surface].filter((row) => matchesQuery(row.label, query));
}
