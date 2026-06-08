import { ProjectRole, TeamRole } from "@trymatcha/types";
import { INVITATION_STATUS } from "./types.invitation";


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

export interface PendingInviteDetail {
    id: string;
    invitedBy: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
    status: INVITATION_STATUS;
    sentAt: Date;
    expiresAt: Date;
    user: {
        email: string;
    };
}

export interface TeamMembersData {
    members: TeamMemberDetail[];
    pendingInvites: PendingInviteDetail[];
    /** The requesting user's effective role in the team's project. */
    viewerRole: ProjectRole | null;
}
