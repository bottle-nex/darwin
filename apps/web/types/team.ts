import type { ProjectRole, TeamRole } from "@trymatcha/types";

export const MEMBER_SELECTION_PREFIX = {
    member: "member:",
    invite: "invite:",
} as const;

export function memberSelectionKey(userId: string): string {
    return `${MEMBER_SELECTION_PREFIX.member}${userId}`;
}

export function inviteSelectionKey(invitationId: string): string {
    return `${MEMBER_SELECTION_PREFIX.invite}${invitationId}`;
}

export function splitMemberSelection(keys: string[]) {
    return {
        memberUserIds: keys
            .filter((key) => key.startsWith(MEMBER_SELECTION_PREFIX.member))
            .map((key) => key.slice(MEMBER_SELECTION_PREFIX.member.length)),
        invitationIds: keys
            .filter((key) => key.startsWith(MEMBER_SELECTION_PREFIX.invite))
            .map((key) => key.slice(MEMBER_SELECTION_PREFIX.invite.length)),
    };
}

import type { INVITATION_STATUS } from "./types.invitation";

export interface TeamMemberDetail {
    id: string;
    role: TeamRole;
    projectRole: ProjectRole | null;
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
    /** The requesting user's role inside this team, which grants its own member powers. */
    viewerTeamRole: TeamRole | null;
}
