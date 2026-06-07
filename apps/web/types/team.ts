import type { ProjectRole } from "./project";

export type TeamRole = "Maintainer" | "Member";

export interface TeamMemberDetail {
    id: string;
    role: TeamRole;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
}

export interface TeamMembersData {
    members: TeamMemberDetail[];
    pendingInvites: number;
    /** The requesting user's effective role in the team's project. */
    viewerRole: ProjectRole | null;
}
