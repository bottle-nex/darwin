"use client";
import type { SidebarSectionProps } from "../../sidebar/shared";
import WorkersSection from "./WorkersSection";

export default function WorkersSidebar(props: SidebarSectionProps) {
    return <WorkersSection {...props} />;
}
