/**
 * Top-level surfaces of the matcha workspace.
 *
 * The sidebar renders one surface's nav at a time and the main pane follows it.
 * This enum is the single source of truth shared by the two.
 */
export enum Surface {
    Home = "home",
    Projects = "projects",
    PullRequests = "pull-requests",
    Agents = "agents",
    Workers = "workers",
    More = "more",
}
