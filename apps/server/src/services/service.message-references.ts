import { prisma } from "@trydarwin/database";
import type { LabelledReference } from "@trydarwin/types";
import { filter_reference_tokens, reference_ids } from "@trydarwin/types";

import { issue_recipients } from "../notifications/recipients";

export const MESSAGE_REFERENCE_INCLUDE = {
    member: { include: { user: true } },
    issue: {
        select: {
            id: true,
            number: true,
            title: true,
            status: true,
            priority: true,
            description: true,
        },
    },
    team: { select: { id: true, name: true, icon: true } },
} as const;

export type MentionTargets = {
    memberIds: string[];
    userIds: string[];
};

export type ResolvedReferences = {
    message: string;
    memberIds: string[];
    issueIds: string[];
    teamIds: string[];
};

export default class MessageReferenceService {
    static async resolve(
        message: string,
        project_id: string,
        team_id?: string,
    ): Promise<ResolvedReferences> {
        const member_ids = reference_ids(message, "member");
        const issue_ids = reference_ids(message, "issue");
        const team_ids = reference_ids(message, "team");
        const reachable_team_ids = team_id ? team_ids.filter((id) => id === team_id) : team_ids;

        const [members, issues, teams] = await Promise.all([
            member_ids.length
                ? prisma.projectMember.findMany({
                      where: {
                          id: { in: member_ids },
                          projectId: project_id,
                          ...(team_id
                              ? {
                                    user: {
                                        teamMemberships: { some: { teamId: team_id } },
                                    },
                                }
                              : {}),
                      },
                      select: { id: true },
                  })
                : [],
            issue_ids.length
                ? prisma.issue.findMany({
                      where: { id: { in: issue_ids }, projectId: project_id },
                      select: { id: true },
                  })
                : [],
            reachable_team_ids.length
                ? prisma.team.findMany({
                      where: { id: { in: reachable_team_ids }, projectId: project_id },
                      select: { id: true },
                  })
                : [],
        ]);

        const valid = {
            member: new Set(members.map((member) => member.id)),
            issue: new Set(issues.map((issue) => issue.id)),
            team: new Set(teams.map((team) => team.id)),
        };

        return {
            message: filter_reference_tokens(message, (kind, id) => valid[kind].has(id)),
            memberIds: [...valid.member],
            issueIds: [...valid.issue],
            teamIds: [...valid.team],
        };
    }

    static async labels_for(resolved: ResolvedReferences): Promise<LabelledReference[]> {
        const [members, issues, teams] = await Promise.all([
            resolved.memberIds.length
                ? prisma.projectMember.findMany({
                      where: { id: { in: resolved.memberIds } },
                      select: { id: true, user: { select: { name: true, email: true } } },
                  })
                : [],
            resolved.issueIds.length
                ? prisma.issue.findMany({
                      where: { id: { in: resolved.issueIds } },
                      select: { id: true, number: true, title: true },
                  })
                : [],
            resolved.teamIds.length
                ? prisma.team.findMany({
                      where: { id: { in: resolved.teamIds } },
                      select: { id: true, name: true },
                  })
                : [],
        ]);

        return [
            ...members.map((member) => ({
                memberId: member.id,
                issueId: null,
                teamId: null,
                member: { user: member.user },
            })),
            ...issues.map((issue) => ({
                memberId: null,
                issueId: issue.id,
                teamId: null,
                issue,
            })),
            ...teams.map((team) => ({
                memberId: null,
                issueId: null,
                teamId: team.id,
                team,
            })),
        ];
    }

    static to_rows(resolved: ResolvedReferences) {
        return [
            ...resolved.memberIds.map((memberId) => ({ memberId })),
            ...resolved.issueIds.map((issueId) => ({ issueId })),
            ...resolved.teamIds.map((teamId) => ({ teamId })),
        ];
    }

    static async mention_targets(input: {
        memberIds: string[];
        teamIds: string[];
        projectId: string;
        actorId: string;
    }): Promise<MentionTargets> {
        if (!input.memberIds.length && !input.teamIds.length) return { memberIds: [], userIds: [] };

        const members = await prisma.projectMember.findMany({
            where: {
                projectId: input.projectId,
                OR: [
                    ...(input.memberIds.length ? [{ id: { in: input.memberIds } }] : []),
                    ...(input.teamIds.length
                        ? [
                              {
                                  user: {
                                      teamMemberships: { some: { teamId: { in: input.teamIds } } },
                                  },
                              },
                          ]
                        : []),
                ],
            },
            select: { id: true, userId: true },
        });

        const targets = members.filter((member) => member.userId !== input.actorId);
        return {
            memberIds: targets.map((member) => member.id),
            userIds: targets.map((member) => member.userId),
        };
    }

    static async referenced_issue_recipients(input: {
        issueIds: string[];
        exclude: string[];
    }): Promise<{ issueId: string; recipientId: string }[]> {
        if (!input.issueIds.length) return [];

        const issues = await prisma.issue.findMany({
            where: { id: { in: input.issueIds } },
            select: { id: true, createdById: true, assignees: { select: { id: true } } },
        });

        return issues.flatMap((issue) =>
            issue_recipients({
                assigneeIds: issue.assignees.map((assignee) => assignee.id),
                creatorId: issue.createdById,
                exclude: input.exclude,
            }).map((recipientId) => ({ issueId: issue.id, recipientId })),
        );
    }
}
