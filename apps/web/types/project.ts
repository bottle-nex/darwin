import type {
    BackgroundLightingColor,
    CodeTheme,
    ColorScheme,
    DefaultHomeView,
    DiffView,
    ProjectRole,
    SwipeTarget,
    TeamRole,
} from "@trydarwin/types";

import type { IconPick } from "@/components/ui/IconPicker";

import type { Effort, Harness } from "./harness.type";

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
    codeTheme: CodeTheme;
    diffView: DiffView;
    swipeTarget: SwipeTarget;
    colorScheme: ColorScheme;
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
    icon: IconPick | null;
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

export type ExecutionMode = "Autonomous" | "Manual";

export const EXECUTION_MODE_OPTIONS: { id: ExecutionMode; label: string; description: string }[] = [
    {
        id: "Autonomous",
        label: "Autonomous",
        description: "The agent solves the issue and opens the pull request on its own.",
    },
    {
        id: "Manual",
        label: "Manual",
        description:
            "The agent asks you when the issue is ambiguous, and waits for your approval before opening the pull request.",
    },
];

export interface ProjectConfig {
    kanbanOptionView: KanbanOptionView;
    productDiffEnabled: boolean;
    harness: Harness;
    defaultModel: string | null;
    defaultEffort: Effort | null;
    executionMode: ExecutionMode;
}
