import { IssueStatus, OrgRole, ProjectRole, TeamRole } from "./enums.prisma";

export interface User {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    emailVerified: Date | null;
    setupComplete: boolean;

    orgMemberships?: OrgMember[];
    teamMemberships?: TeamMember[];
    projectMemberships?: ProjectMember[];
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
    members?: ProjectMember[];

    createdAt: Date;
    updatedAt: Date;
}

export interface Team {
    id: string;
    projectId: string;
    name: string;
    slug: string;
    description: string | null;

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

export interface ProjectMember {
    id: string;
    projectId: string;
    userId: string;
    role: ProjectRole;

    project?: Project;
    user?: User;

    createdAt: Date;
    updatedAt: Date;
}

export interface Issue {
    id: string;
    number: number;
    createdById: string;
    title: string;
    summary: string | null;
    description: string;
    status: IssueStatus;
    priority: number;
    customColumnId: string | null;
    startDate: Date | null;
    targetDate: Date | null;

    creator: User;
    assignees: User[];
    tags: Tag[];

    createdAt: Date;
}

export interface Tag {
    id: string;
    projectId: string;
    name: string;
    color: string;

    createdAt: Date;
    updatedAt: Date;
}

export interface Chat {
    id: string;
    issueId: string;
    message: string;
    isDeleted: boolean;

    senderId: string | null;
    sender: User | null;

    repliedToId: string | null;
    /** included one level deep on reads/broadcasts; absent on the nested quote itself. */
    repliedTo?: Chat | null;

    mentions: ChatMention[];

    createdAt: Date;
    updatedAt: Date;
}

/** A user @-tagged in a Chat message, scoped to their ProjectMember row. */
export interface ChatMention {
    id: string;
    chatId: string;
    memberId: string;
    member?: ProjectMember;

    createdAt: Date;
}

export interface ProjectChat {
    id: string;
    projectId: string;
    message: string;
    isDeleted: boolean;

    senderId: string | null;
    sender: User | null;

    repliedToId: string | null;
    /** included one level deep on reads/broadcasts; absent on the nested quote itself. */
    repliedTo?: ProjectChat | null;

    mentions: ProjectChatMention[];

    createdAt: Date;
    updatedAt: Date;
}

/** A user @-tagged in a ProjectChat message, scoped to their ProjectMember row. */
export interface ProjectChatMention {
    id: string;
    projectChatId: string;
    memberId: string;
    member?: ProjectMember;

    createdAt: Date;
}
