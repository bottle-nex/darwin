"use client";
import type { SidebarSectionProps } from "../../Sidebar/shared";
import AgentsSection from "./AgentsSection";

export default function AgentsSidebar(props: SidebarSectionProps) {
    return <AgentsSection {...props} />;
}
