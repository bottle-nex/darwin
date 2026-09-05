import { prisma } from "@trymatcha/database";
import {
    DESCRIPTION_REFERENCE_INCLUDE,
    description_reference_labels,
    type DescriptionReferenceRow,
} from "@trymatcha/services";
import type { LabelledReference } from "@trymatcha/types";

import { server_services } from "..";
import MessageReferenceService, { type ResolvedReferences } from "./service.message-references";

export { DESCRIPTION_REFERENCE_INCLUDE };

type DescriptionWrite = {
    issueId: string;
    projectId: string;
    actorId: string;
    resolved: ResolvedReferences;
};

type DescriptionTargets = { memberId: string | null; teamId: string | null };

export default class DescriptionReferenceService {
    /**
     * Validates the tokens in a description against the project, returning the
     * description with references to anything outside it stripped.
     */
    static resolve(description: string, project_id: string): Promise<ResolvedReferences> {
        return MessageReferenceService.resolve(description, project_id);
    }

    static to_labels(rows: DescriptionReferenceRow[]): LabelledReference[] {
        return description_reference_labels(rows);
    }

    /** Replaces the issue's reference rows with the ones its description now holds. */
    static async write(input: DescriptionWrite): Promise<void> {
        const previous = await prisma.descriptionReference.findMany({
            where: { issueId: input.issueId },
            select: { memberId: true, teamId: true },
        });

        await prisma.$transaction([
            prisma.descriptionReference.deleteMany({ where: { issueId: input.issueId } }),
            prisma.descriptionReference.createMany({
                data: [
                    ...input.resolved.memberIds.map((memberId) => ({
                        issueId: input.issueId,
                        memberId,
                    })),
                    ...input.resolved.issueIds.map((referencedIssueId) => ({
                        issueId: input.issueId,
                        referencedIssueId,
                    })),
                    ...input.resolved.teamIds.map((teamId) => ({
                        issueId: input.issueId,
                        teamId,
                    })),
                ],
            }),
        ]);

        await DescriptionReferenceService.notify_added(input, previous);
    }

    /**
     * Only people the description did not already reach are notified, so editing
     * an issue does not re-alert everyone tagged in it.
     */
    private static async notify_added(
        input: DescriptionWrite,
        previous: DescriptionTargets[],
    ): Promise<void> {
        const [reached, current] = await Promise.all([
            MessageReferenceService.mention_targets({
                memberIds: previous.flatMap((row) => (row.memberId ? [row.memberId] : [])),
                teamIds: previous.flatMap((row) => (row.teamId ? [row.teamId] : [])),
                projectId: input.projectId,
                actorId: input.actorId,
            }),
            MessageReferenceService.mention_targets({
                memberIds: input.resolved.memberIds,
                teamIds: input.resolved.teamIds,
                projectId: input.projectId,
                actorId: input.actorId,
            }),
        ]);

        const already = new Set(reached.memberIds);
        await Promise.all(
            current.memberIds
                .filter((memberId) => !already.has(memberId))
                .map((memberId) =>
                    server_services.notifications.enqueue({
                        action: "issue.description_mention",
                        issueId: input.issueId,
                        memberId,
                        mentionedById: input.actorId,
                    }),
                ),
        );
    }
}
