import { prisma } from "@trymatcha/database";

import MessageReferenceService, { type ResolvedReferences } from "./service.message-references";

export default class DescriptionReferenceService {
    /**
     * Validates the tokens in a description against the project, returning the
     * description with references to anything outside it stripped.
     */
    static resolve(description: string, project_id: string): Promise<ResolvedReferences> {
        return MessageReferenceService.resolve(description, project_id);
    }

    /** Replaces the issue's reference rows with the ones its description now holds. */
    static async write(issue_id: string, resolved: ResolvedReferences): Promise<void> {
        await prisma.$transaction([
            prisma.descriptionReference.deleteMany({ where: { issueId: issue_id } }),
            prisma.descriptionReference.createMany({
                data: [
                    ...resolved.memberIds.map((memberId) => ({ issueId: issue_id, memberId })),
                    ...resolved.issueIds.map((referencedIssueId) => ({
                        issueId: issue_id,
                        referencedIssueId,
                    })),
                ],
            }),
        ]);
    }
}
