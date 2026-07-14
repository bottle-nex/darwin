"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { Surface } from "../../Sidebar/surface";
import { AgentsTab } from "../agentsTabs";
import AllRunsDisplay from "./AllRunsDisplay";
import AgentDetailDisplay from "./AgentDetailDisplay";

/** Renders the Agents surface — all runs, or a selected agent's detail. */
export default function AgentsDisplay() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[Surface.Agents]);

    switch (tab) {
        case AgentsTab.AllRuns:
            return <AllRunsDisplay />;
        default:
            return <AgentDetailDisplay id={tab} />;
    }
}
