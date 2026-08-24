import type {
    BackgroundLightingColor,
    DefaultHomeView,
    ProductDiffPreviewConfiguration,
    ProjectRole,
    TeamRole,
} from "@trymatcha/types";

import type { IconPick } from "@/components/ui/IconPicker";

export type PlanStatus = "Pending" | "Generating" | "Ready" | "Failed";

export interface Project {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: IconPick | null;
    githubRepoFullName: string | null;
    githubRepoUrl: string | null;
    githubDefaultBranch: string | null;
    createdAt: string;
}

export interface UserConfig {
    backgroundLightingEnabled: boolean;
    backgroundLightingColor: BackgroundLightingColor;
    defaultHomeView: DefaultHomeView;
}

export interface DashboardData {
    org: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        createdAt: string;
    };
    projects: Project[];
    userConfig: UserConfig;
}

export interface ProjectTeam {
    id: string;
    name: string;
    slug: string;
    viewerRole: TeamRole | null;
}

export interface ProjectDetail {
    id: string;
    name: string;
    slug: string;
    summary: string | null;
    description: string | null;
    githubRepoFullName: string | null;
    githubRepoUrl: string | null;
    githubDefaultBranch: string | null;
    icon: IconPick | null;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    tourCompleted: boolean;
    planMd: string | null;
    planStatus: PlanStatus;
    planGeneratedAt: string | null;
    teams: ProjectTeam[];
    /** The requesting user's effective role in this project (highest of org/owner/team). */
    viewerRole: ProjectRole | null;
}

export type KanbanOptionView = "FLAT" | "GROUPED";

export interface ProjectConfig {
    kanbanOptionView: KanbanOptionView;
    productDiffEnabled: boolean;
    productDiffPreviewConfig: ProductDiffPreviewConfiguration | null;
}
