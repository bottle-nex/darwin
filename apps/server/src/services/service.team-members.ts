import { InvitationStatus, prisma, TeamRole } from "@trydarwin/database";

type AddProjectMembersInput = {
    teamId: string;
    projectId: string;
    orgId: string;
    userIds: string[];
};

type AddProjectMembersResult = {
    addedUserIds: string[];
    recognizedEmails: string[];
    failed: { userId: string; reason: string }[];
};

export default class TeamMemberService {
    static async add_project_members({
        teamId,
        projectId,
        orgId,
        userIds,
    }: AddProjectMembersInput): Promise<AddProjectMembersResult> {
        const requested_user_ids = [...new Set(userIds)];
        const [project_members, team_members] = await Promise.all([
            prisma.projectMember.findMany({
                where: {
                    projectId,
                    userId: { in: requested_user_ids },
                    user: { orgMemberships: { some: { orgId } } },
                },
                select: {
                    userId: true,
                    user: { select: { email: true } },
                },
            }),
            prisma.teamMember.findMany({
                where: { teamId, userId: { in: requested_user_ids } },
                select: { userId: true },
            }),
        ]);
        const project_member_by_id = new Map(
            project_members.map((member) => [member.userId, member]),
        );
        const existing_team_member_ids = new Set(team_members.map((member) => member.userId));
        const failed: { userId: string; reason: string }[] = [];
        const addable_user_ids: string[] = [];

        for (const userId of requested_user_ids) {
            if (!project_member_by_id.has(userId)) {
                failed.push({ userId, reason: "not_project_member" });
            } else if (existing_team_member_ids.has(userId)) {
                failed.push({ userId, reason: "already_member" });
            } else {
                addable_user_ids.push(userId);
            }
        }

        if (addable_user_ids.length === 0) {
            return {
                addedUserIds: [],
                recognizedEmails: project_members.map((member) => member.user.email.toLowerCase()),
                failed,
            };
        }

        const created_members = await prisma.$transaction(async (tx) => {
            const created = await tx.teamMember.createManyAndReturn({
                data: addable_user_ids.map((userId) => ({
                    teamId,
                    userId,
                    role: TeamRole.Member,
                })),
                skipDuplicates: true,
                select: { userId: true },
            });
            for (const { userId } of created) {
                await tx.invitation.updateMany({
                    where: {
                        teamId,
                        status: InvitationStatus.Pending,
                        email: project_member_by_id.get(userId)!.user.email,
                    },
                    data: { status: InvitationStatus.Accepted, userId },
                });
            }
            return created;
        });
        const addedUserIds = created_members.map((member) => member.userId);
        const added_user_ids = new Set(addedUserIds);

        for (const userId of addable_user_ids) {
            if (!added_user_ids.has(userId)) {
                failed.push({ userId, reason: "already_member" });
            }
        }

        return {
            addedUserIds,
            recognizedEmails: project_members.map((member) => member.user.email.toLowerCase()),
            failed,
        };
    }
}
