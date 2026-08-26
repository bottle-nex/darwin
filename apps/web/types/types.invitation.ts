import type { ProjectRole } from "../../../packages/types";

export enum INVITATION_STATUS {
    PENDING = "Pending",
    ACCEPTED = "Accepted",
    REJECTED = "Rejected",
}

export enum PROJECT_ROLE {
    ADMIN = "Admin",
    MAINTAIN = "Maintain",
    WRITE = "Write",
    TRAIGE = "Triage",
    READ = "Read",
}

interface Organization {
    name: string;
    slug: string;
}

interface Project {
    name: string;
    slug: string;
}

interface Team {
    name: string;
}

export interface InvitePreview {
    email: string;
    status: INVITATION_STATUS;
    expiresAt: string;
    org: Organization | null;
    role: ProjectRole | null;
    project: Project | null;
    team: Team | null;
    invitedBy: {
        name: string | null;
        email: string;
    };
    teamRoleOnAccept: string;
    emailMatches: boolean;
    isExpired: boolean;
}

export interface InboxInvite extends Omit<InvitePreview, "emailMatches"> {
    id: string;
    createdAt: string;
}
