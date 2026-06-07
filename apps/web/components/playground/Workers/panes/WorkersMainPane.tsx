"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../IconRail/railSurface";
import { WorkersTab } from "../workersTabs";
import WorkersOverviewPane from "./WorkersOverviewPane";
import WorkerDetailPane from "./WorkerDetailPane";

/** Renders the Workers surface — overview, or a selected worker's detail. */
export default function WorkersMainPane() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Workers]);

    switch (tab) {
        case WorkersTab.Overview:
            return <WorkersOverviewPane />;
        default:
            return <WorkerDetailPane id={tab} />;
    }
}
