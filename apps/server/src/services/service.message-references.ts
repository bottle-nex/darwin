import { prisma } from "@trymatcha/database";
import { filter_reference_tokens, reference_ids } from "@trymatcha/types";
import { issue_recipients } from "../notifications/recipients";

export const MESSAGE_REFERENCE_INCLUDE = {
    member: { include: { user: true } },
    issue: { select: { id: true, number: true, title: true, status: true } },
} as const;

export type ResolvedReferences = {
    message: string;
    memberIds: string[];
    issueIds: string[];
};

export default class MessageReferenceService {
    static async resolve(message: string, project_id: string): Promise<ResolvedReferences> {
        const member_ids = reference_ids(message, "member");
        const issue_ids = reference_ids(message, "issue");

        const [members, issues] = await Promise.all([
            member_ids.length
                ? prisma.projectMember.findMany({
                      where: { id: { in: member_ids }, projectId: project_id },
                      select: { id: true },
                  })
                : [],
            issue_ids.length
                ? prisma.issue.findMany({
                      where: { id: { in: issue_ids }, projectId: project_id },
                      select: { id: true },
                  })
                : [],
        ]);

        const valid_members = new Set(members.map((member) => member.id));
        const valid_issues = new Set(issues.map((issue) => issue.id));

        return {
            message: filter_reference_tokens(message, (kind, id) =>
                kind === "member" ? valid_members.has(id) : valid_issues.has(id),
            ),
            memberIds: [...valid_members],
            issueIds: [...valid_issues],
        };
    }

    static to_rows(resolved: ResolvedReferences) {
        return [
            ...resolved.memberIds.map((memberId) => ({ memberId })),
            ...resolved.issueIds.map((issueId) => ({ issueId })),
        ];
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
