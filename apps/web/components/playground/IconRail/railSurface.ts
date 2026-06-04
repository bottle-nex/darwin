/**
 * Top-level surfaces of the matcha workspace.
 *
 * The left icon rail toggles between these, and the sidebar switches its
 * contents to match (see `Sidebar/index.tsx`). This enum is the single source
 * of truth shared by the rail and the sidebar switch.
 */
export enum RailSurface {
    Home = "home",
    Projects = "projects",
    PullRequests = "pull-requests",
    Agents = "agents",
    Workers = "workers",
    More = "more",
}
