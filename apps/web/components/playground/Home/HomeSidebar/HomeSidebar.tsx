"use client";
import type { SidebarSectionProps } from "../../Sidebar/shared";
import PrimaryNavSection from "./PrimaryNavSection";
import FavoritesSection from "./FavoritesSection";
import TeamsSection from "../../Projects/ProjectsSidebar/TeamsSection";

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
