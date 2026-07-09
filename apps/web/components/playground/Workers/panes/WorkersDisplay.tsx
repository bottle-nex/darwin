"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../IconRail/railSurface";
import { WorkersTab } from "../workersTabs";
import WorkersOverviewDisplay from "./WorkersOverviewDisplay";
import WorkerDetailDisplay from "./WorkerDetailDisplay";

/** Renders the Workers surface — overview, or a selected worker's detail. */
export default function WorkersDisplay() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Workers]);

    switch (tab) {
        case WorkersTab.Overview:
            return <WorkersOverviewDisplay />;
        default:
            return <WorkerDetailDisplay id={tab} />;
    }
}
