"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { Surface } from "../../Sidebar/surface";
import { PullRequestsTab } from "../pullRequestsTabs";
import PullRequestsOverviewDisplay from "./PullRequestsOverviewDisplay";
import PullRequestDetailDisplay from "./PullRequestDetailDisplay";

/** Renders the Pull Requests surface — overview, or a selected PR's detail. */
export default function PullRequestsDisplay() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[Surface.PullRequests]);

    switch (tab) {
        case PullRequestsTab.Overview:
            return <PullRequestsOverviewDisplay />;
        default:
            return <PullRequestDetailDisplay id={tab} />;
    }
}
