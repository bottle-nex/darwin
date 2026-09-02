"use client";

import type { ProjectRole, TeamRole } from "@trymatcha/types";

import useRevokeInvite from "@/hooks/invitations/useRevokeInvite";
import { useChangeMemberAuthority } from "@/hooks/team/useChangeMemberAuthority";
import { useChangeProjectRole } from "@/hooks/team/useChangeProjectRole";
import { useGetTeamMembers } from "@/hooks/team/useGetTeamMembers";
import { toast } from "@/lib/toast";
import { useRemoveMembersStore } from "@/store/team/useRemoveMembersStore";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import { splitMemberSelection } from "@/types/team";

export type MemberCommandActions = ReturnType<typeof useMemberCommandActions>;

/**
 * Every action the command menu offers on a team member, in one place.
 *
 * The selection is one flat list of prefixed keys, so it can hold members and
 * pending invites at once. An action only offers itself when the whole selection
 * is the kind it understands — acting on part of a mixed selection would quietly
 * leave the rest behind.
 *
 * Only `remove` has a bulk endpoint. Role changes and revokes fan out over the
 * single-target endpoints with `allSettled`, so one refusal doesn't hide the rest.
 */
export function useMemberCommandActions({
    selectedKeys,
    teamId,
    projectId,
}: {
    selectedKeys: string[];
    teamId: string | null;
    projectId: string | undefined;
}) {
    const viewerId = useUserSessionStore((s) => s.session?.user?.id);
    const { data } = useGetTeamMembers(teamId ?? undefined);

    const changeAuthority = useChangeMemberAuthority(teamId ?? "");
    const changeProjectRole = useChangeProjectRole(projectId, teamId ?? "");
    const revokeInvite = useRevokeInvite(teamId ?? "");
    const requestRemove = useRemoveMembersStore((s) => s.requestRemove);

    const { memberUserIds, invitationIds } = splitMemberSelection(selectedKeys);

    const onlyMembers = memberUserIds.length > 0 && invitationIds.length === 0;
    const onlyInvites = invitationIds.length > 0 && memberUserIds.length === 0;

    const targetUserIds = memberUserIds.filter((userId) => userId !== viewerId);
    const excludedSelf = memberUserIds.length !== targetUserIds.length;

    const isProjectAdmin = data?.viewerRole === "Admin";
    const isTeamMaintainer = data?.viewerTeamRole === "Maintainer";

    const canSetTeamRole =
        onlyMembers && targetUserIds.length > 0 && (isProjectAdmin || isTeamMaintainer);
    const canSetProjectRole = onlyMembers && targetUserIds.length > 0 && isProjectAdmin;
    const canRemove = onlyMembers && targetUserIds.length > 0 && isProjectAdmin;
    const canRevoke = onlyInvites && isProjectAdmin;

    const soleTarget =
        selectedKeys.length === 1
            ? onlyInvites
                ? data?.pendingInvites.find((invite) => invite.id === invitationIds[0])?.user.email
                : (() => {
                      const member = data?.members.find(
                          (row) => row.user.id === memberUserIds[0],
                      )?.user;
                      return member?.name?.trim() || member?.email;
                  })()
            : undefined;

    function warnSelfSkipped() {
        if (excludedSelf) toast.info("You can't change your own membership.");
    }

    async function fanOut<T>(items: T[], run: (item: T) => Promise<unknown>, noun: string) {
        const results = await Promise.allSettled(items.map(run));
        const failed = results.filter((result) => result.status === "rejected").length;
        if (!failed) return;
        toast.error(
            failed === items.length
                ? `Couldn't update ${noun}.`
                : `Couldn't update ${failed} of ${items.length} ${noun}.`,
        );
    }

    return {
        count: selectedKeys.length,
        soleTarget,
        memberCount: memberUserIds.length,
        inviteCount: invitationIds.length,
        onlyMembers,
        onlyInvites,
        canSetTeamRole,
        canSetProjectRole,
        canRemove,
        canRevoke,

        setTeamRole: async (role: TeamRole) => {
            if (!canSetTeamRole) return;
            warnSelfSkipped();
            await fanOut(
                targetUserIds,
                (memberId) => changeAuthority.mutateAsync({ memberId, role }),
                "those members",
            );
        },

        setProjectRole: async (role: ProjectRole) => {
            if (!canSetProjectRole) return;
            warnSelfSkipped();
            await fanOut(
                targetUserIds,
                (userId) => changeProjectRole.mutateAsync({ userId, role }),
                "those members",
            );
        },

        requestRemoveFromTeam: () => {
            if (!canRemove) return;
            warnSelfSkipped();
            requestRemove({ userIds: targetUserIds, scope: "team" });
        },

        requestRemoveFromOrg: () => {
            if (!canRemove) return;
            warnSelfSkipped();
            requestRemove({ userIds: targetUserIds, scope: "org" });
        },

        revokeInvites: async () => {
            if (!canRevoke) return;
            await fanOut(
                invitationIds,
                (invitationId) => revokeInvite.mutateAsync(invitationId),
                "those invites",
            );
        },
    };
}
