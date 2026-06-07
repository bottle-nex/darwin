"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../IconRail/railSurface";
import HomeMainPane from "../Home/panes/HomeMainPane";
import ProjectsMainPane from "../Projects/panes/ProjectsMainPane";
import PullRequestsMainPane from "../PullRequests/panes/PullRequestsMainPane";
import AgentsMainPane from "../Agents/panes/AgentsMainPane";
import WorkersMainPane from "../Workers/panes/WorkersMainPane";
import MoreMainPane from "../More/panes/MoreMainPane";

/** Picks the active surface's main pane. */
function SurfacePane({ surface }: { surface: RailSurface }) {
    switch (surface) {
        case RailSurface.Home:
            return <HomeMainPane />;
        case RailSurface.Projects:
            return <ProjectsMainPane />;
        case RailSurface.PullRequests:
            return <PullRequestsMainPane />;
        case RailSurface.Agents:
            return <AgentsMainPane />;
        case RailSurface.Workers:
            return <WorkersMainPane />;
        case RailSurface.More:
            return <MoreMainPane />;
    }
}

/**
 * Top-level main-pane router. Provides the shared `<main>` frame and delegates
 * to the active surface's pane, which in turn switches on its active tab.
 */
export default function PlaygroundMainPane() {
    const surface = usePlaygroundNavStore((s) => s.surface);

    return (
        <main className="flex flex-1 min-w-0 flex-col">
            <SurfacePane surface={surface} />
        </main>
    );
}
