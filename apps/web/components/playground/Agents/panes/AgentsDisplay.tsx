"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../IconRail/railSurface";
import { AgentsTab } from "../agentsTabs";
import AllRunsDisplay from "./AllRunsDisplay";
import AgentDetailDisplay from "./AgentDetailDisplay";

/** Renders the Agents surface — all runs, or a selected agent's detail. */
export default function AgentsDisplay() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Agents]);

    switch (tab) {
        case AgentsTab.AllRuns:
            return <AllRunsDisplay />;
        default:
            return <AgentDetailDisplay id={tab} />;
    }
}
