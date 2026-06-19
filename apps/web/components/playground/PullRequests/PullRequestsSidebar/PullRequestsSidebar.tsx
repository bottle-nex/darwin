"use client";
import type { SidebarSectionProps } from "../../sidebar/shared";
import PullRequestsSection from "./PullRequestsSection";

export default function PullRequestsSidebar(props: SidebarSectionProps) {
    return <PullRequestsSection {...props} />;
}
