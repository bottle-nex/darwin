"use client";
import type { SidebarSectionProps } from "../../Sidebar/shared";
import PrimaryNavSection from "./PrimaryNavSection";
import MyWorkSection from "./MyWorkSection";
import FavoritesSection from "./FavoritesSection";
import ProjectsSection from "../../Projects/ProjectsSidebar/ProjectsSection";
import TeamsSection from "../../Projects/ProjectsSidebar/TeamsSection";
import AgentsSection from "../../Agents/AgentsSidebar/AgentsSection";

export default function HomeSidebar(props: SidebarSectionProps) {
    return (
        <>
            <PrimaryNavSection {...props} />
            {/* <MyWorkSection {...props} /> */}
            <FavoritesSection {...props} />
            {/* <ProjectsSection {...props} /> */}
            <TeamsSection {...props} />
            {/* <AgentsSection {...props} /> */}
        </>
    );
}
