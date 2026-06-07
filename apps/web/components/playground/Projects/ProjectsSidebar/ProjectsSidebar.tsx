"use client";
import type { SidebarSectionProps } from "../../Sidebar/shared";
import ProjectsSection from "./ProjectsSection";
import TeamsSection from "./TeamsSection";

export default function ProjectsSidebar(props: SidebarSectionProps) {
    return (
        <>
            <ProjectsSection {...props} />
            <TeamsSection {...props} />
        </>
    );
}
