"use client";
import type { SidebarSectionProps } from "../../sidebar/shared";
import AgentsSection from "./AgentsSection";

export default function AgentsSidebar(props: SidebarSectionProps) {
    return <AgentsSection {...props} />;
}
