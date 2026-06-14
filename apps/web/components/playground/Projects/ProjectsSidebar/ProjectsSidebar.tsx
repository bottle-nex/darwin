"use client";
import type { SidebarSectionProps } from "../../Sidebar/shared";
import ProjectsSection from "./ProjectsSection";

export default function ProjectsSidebar(props: SidebarSectionProps) {
    return (
        <>
            <ProjectsSection {...props} />
        </>
    );
}
