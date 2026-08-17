import {
    IssueStatus,
    NotificationType,
    OrgRole,
    PostKind,
    PostStatus,
    ProjectRole,
    ReleaseChannel,
    TeamRole,
} from "./enums.prisma";
import type { ReactionSummary } from "../chat/reaction";

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
    description: string;
    status: IssueStatus;
    priority: number;
    customColumnId: string | null;
    startDate: Date | null;
    targetDate: Date | null;
    prUrl: string | null;

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

    references: MessageReference[];
    reactions: ReactionSummary[];

    createdAt: Date;
    updatedAt: Date;
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

    references: MessageReference[];
    reactions: ReactionSummary[];

    createdAt: Date;
    updatedAt: Date;
}

export interface ReferencedIssue {
    id: string;
    number: number;
    title: string;
    status: IssueStatus;
    priority: number;
}

export interface MessageReference {
    id: string;
    chatId: string | null;
    projectChatId: string | null;
    memberId: string | null;
    issueId: string | null;

    member?: ProjectMember | null;
    issue?: ReferencedIssue | null;

    createdAt: Date;
}

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    payload: Record<string, unknown>;
    readAt: Date | null;

    createdAt: Date;
}

export interface Post {
    id: string;
    kind: PostKind;
    slug: string;
    title: string;
    summary: string | null;
    content: string;
    plainText: string;
    coverImage: string | null;
    author: string | null;
    tags: string[];
    version: string | null;
    channel: ReleaseChannel | null;
    status: PostStatus;
    readingTime: number;
    publishedAt: Date | null;

    createdAt: Date;
    updatedAt: Date;
}
