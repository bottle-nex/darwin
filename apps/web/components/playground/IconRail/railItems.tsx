import type { FC } from "react";
import type { LucideProps } from "lucide-react";
import { RailSurface } from "./railSurface";
import {
    AgentsIcon,
    HomeIcon,
    MoreIcon,
    ProjectsIcon,
    PullRequestsIcon,
    WorkersIcon,
} from "./icons";

export type RailItem = {
    surface: RailSurface;
    label: string;
    Icon: FC<LucideProps>;
    badge?: number;
    /** Accent treatment for the active item — currently only "green" for Home. */
    accent?: "green";
};
/**
 * The icon rail surfaces the top-level stages of the matcha flow: file issues
 * on a project board, agents pick them up, runners build/test, PRs ship.
 */
export const RAIL_ITEMS: RailItem[] = [
    { surface: RailSurface.Home, label: "Home", Icon: HomeIcon, accent: "green" },
    { surface: RailSurface.Projects, label: "Projects", Icon: ProjectsIcon },
    { surface: RailSurface.PullRequests, label: "PRs", Icon: PullRequestsIcon },
    { surface: RailSurface.Agents, label: "Agents", Icon: AgentsIcon },
    { surface: RailSurface.Workers, label: "Workers", Icon: WorkersIcon },
    { surface: RailSurface.More, label: "More", Icon: MoreIcon },
];
