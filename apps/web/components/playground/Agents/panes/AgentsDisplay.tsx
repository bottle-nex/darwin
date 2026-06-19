"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../IconRail/railSurface";
import { AgentsTab } from "../agentsTabs";
import AllRunsPane from "./AllRunsPane";
import AgentDetailPane from "./AgentDetailPane";

/** Renders the Agents surface — all runs, or a selected agent's detail. */
export default function AgentsDisplay() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Agents]);

    switch (tab) {
        case AgentsTab.AllRuns:
            return <AllRunsPane />;
        default:
            return <AgentDetailPane id={tab} />;
    }
}
