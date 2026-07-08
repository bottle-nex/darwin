import { ProjectRole } from "@trymatcha/types";

export interface Project {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    githubRepoFullName: string | null;
    githubRepoUrl: string | null;
    githubDefaultBranch: string | null;
    createdAt: string;
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
}

export interface ProjectTeam {
    id: string;
    name: string;
    slug: string;
}

export interface ProjectDetail {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    teams: ProjectTeam[];
    /** The requesting user's effective role in this project (highest of org/owner/team). */
    viewerRole: ProjectRole | null;
}
