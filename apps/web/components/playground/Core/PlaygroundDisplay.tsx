"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { Surface } from "../Sidebar/surface";
import HomeDisplay from "../Home/panes/HomeDisplay";
import ProjectsDisplay from "../Projects/panes/ProjectsDisplay";
import PullRequestsDisplay from "../PullRequests/panes/PullRequestsDisplay";
import AgentsDisplay from "../Agents/panes/AgentsDisplay";
import WorkersDisplay from "../Workers/panes/WorkersDisplay";
import MoreDisplay from "../More/panes/MoreDisplay";

/** Picks the active surface's main pane. */
function SurfacePane({ surface }: { surface: Surface }) {
    switch (surface) {
        case Surface.Home:
            return <HomeDisplay />;
        case Surface.Projects:
            return <ProjectsDisplay />;
        case Surface.PullRequests:
            return <PullRequestsDisplay />;
        case Surface.Agents:
            return <AgentsDisplay />;
        case Surface.Workers:
            return <WorkersDisplay />;
        case Surface.More:
            return <MoreDisplay />;
    }
}

/**
 * Top-level main-pane router. Provides the shared card frame and delegates to
 * the active surface's pane, which in turn switches on its active tab.
 */
export default function PlaygroundDisplay() {
    const surface = usePlaygroundNavStore((s) => s.surface);

    return (
        <main className="flex flex-1 min-w-0 flex-col overflow-hidden rounded-lg ring-1 ring-white/6 bg-cement/60 backdrop-blur-md">
            <SurfacePane surface={surface} />
        </main>
    );
}
