import type { ProjectRole } from "@trymatcha/types";

export type OverviewLinkKind =
    "figma" | "github" | "notion" | "live" | "staging" | "docs" | "other";

export type OverviewLink = {
    id: string;
    kind: OverviewLinkKind;
    label: string;
    url: string;
};

export type OverviewMember = {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: ProjectRole;
};

export type OverviewStatus = "active" | "paused" | "archived";

export type AgentBriefDoc = {
    markdown: string;
    updatedAt: string;
};

export type ProjectOverview = {
    key: string;
    repo: string;
    name: string;
    purpose: string;
    description: string;
    brief: AgentBriefDoc;
    links: OverviewLink[];
    leadId: string;
    team: OverviewMember[];
    status: OverviewStatus;
    createdAt: string;
    updatedAt: string;
};
