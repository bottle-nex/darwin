"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../IconRail/railSurface";
import HomeDisplay from "../Home/panes/HomeDisplay";
import ProjectsDisplay from "../Projects/panes/ProjectsDisplay";
import PullRequestsDisplay from "../PullRequests/panes/PullRequestsDisplay";
import AgentsDisplay from "../Agents/panes/AgentsDisplay";
import WorkersDisplay from "../Workers/panes/WorkersDisplay";
import MoreDisplay from "../More/panes/MoreDisplay";

/** Picks the active surface's main pane. */
function SurfacePane({ surface }: { surface: RailSurface }) {
    switch (surface) {
        case RailSurface.Home:
            return <HomeDisplay />;
        case RailSurface.Projects:
            return <ProjectsDisplay />;
        case RailSurface.PullRequests:
            return <PullRequestsDisplay />;
        case RailSurface.Agents:
            return <AgentsDisplay />;
        case RailSurface.Workers:
            return <WorkersDisplay />;
        case RailSurface.More:
            return <MoreDisplay />;
    }
}

/**
 * Top-level main-pane router. Provides the shared `<main>` frame and delegates
 * to the active surface's pane, which in turn switches on its active tab.
 */
export default function PlaygroundDisplay() {
    const surface = usePlaygroundNavStore((s) => s.surface);

    return (
        <main className="flex flex-1 min-w-0 flex-col">
            <SurfacePane surface={surface} />
        </main>
    );
}
