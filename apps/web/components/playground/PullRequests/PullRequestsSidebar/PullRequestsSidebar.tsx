"use client";
import type { SidebarSectionProps } from "../../Sidebar/shared";
import PullRequestsSection from "./PullRequestsSection";

export default function PullRequestsSidebar(props: SidebarSectionProps) {
    return <PullRequestsSection {...props} />;
}
