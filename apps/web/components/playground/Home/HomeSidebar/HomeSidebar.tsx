"use client";
import type { SidebarSectionProps } from "../../sidebar/shared";
import PrimaryNavSection from "./PrimaryNavSection";
import FavoritesSection from "./FavoritesSection";
import TeamsSection from "../../projects/projectsidebar/TeamsSection";

export default function HomeSidebar(props: SidebarSectionProps) {
    return (
        <>
            <PrimaryNavSection {...props} />
            {/* <MyWorkSection {...props} /> */}
            {/* <FavoritesSection {...props} /> */}
            {/* <ProjectsSection {...props} /> */}
            <TeamsSection {...props} />
            {/* <AgentsSection {...props} /> */}
        </>
    );
}
