export type ProjectRole = "Admin" | "Maintain" | "Write" | "Triage" | "Read";

export interface Project {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
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
    projectRole: ProjectRole;
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
}
