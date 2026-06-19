"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../IconRail/railSurface";
import { PullRequestsTab } from "../pullRequestsTabs";
import PullRequestsOverviewPane from "./PullRequestsOverviewPane";
import PullRequestDetailPane from "./PullRequestDetailPane";

/** Renders the Pull Requests surface — overview, or a selected PR's detail. */
export default function PullRequestsDisplay() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.PullRequests]);

    switch (tab) {
        case PullRequestsTab.Overview:
            return <PullRequestsOverviewPane />;
        default:
            return <PullRequestDetailPane id={tab} />;
    }
}
