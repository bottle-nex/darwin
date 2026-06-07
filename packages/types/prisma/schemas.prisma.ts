import { OrgRole, ProjectRole, TeamRole } from "./enums.prisma";

export interface User {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    emailVerified: Date | null;
    setupComplete: boolean;

    orgMemberships?: OrgMember[];
    teamMemberships?: TeamMember[];
    ownedProjects?: Project[];
    createdProjects?: Project[];
    createdOrganizations?: Organization[];
    createdIssues: Issue[];
    assignedIssues: Issue[];

    createdAt: Date;
    updatedAt: Date;
}

export interface Organization {
    id: string;
    createdById: string;
    name: string;
    slug: string;
    description: string | null;

    members?: OrgMember[];
    projects?: Project[];
    createdBy?: User;

    createdAt: Date;
    updatedAt: Date;
}

export interface OrgMember {
    id: string;
    orgId: string;
    userId: string;
    role: OrgRole;

    organization?: Organization;
    user?: User;

    createdAt: Date;
    updatedAt: Date;
}

export interface Project {
    id: string;
    orgId: string;
    name: string;
    slug: string;
    description: string | null;
    ownerId: string;
    createdById: string | null;

    organization?: Organization;
    owner?: User;
    createdBy?: User | null;
    teams?: Team[];

    createdAt: Date;
    updatedAt: Date;
}

export interface Team {
    id: string;
    projectId: string;
    name: string;
    slug: string;
    description: string | null;
    projectRole: ProjectRole;

    project?: Project;
    members?: TeamMember[];

    createdAt: Date;
    updatedAt: Date;
}

export interface TeamMember {
    id: string;
    teamId: string;
    userId: string;
    role: TeamRole;

    team?: Team;
    user?: User;

    createdAt: Date;
    updatedAt: Date;
}

export interface Issue {
    id: string;
    createdById: string;
    title: string;
    description: string;

    creator: User;
    assignees: User[];
}
