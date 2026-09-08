import type { Prisma } from "@trydarwin/database";
import { OutboundSocketMessageType } from "@trydarwin/types";

import { publisher } from "./service.publisher";

export type BroadcastableIssue = Prisma.IssueGetPayload<{
    include: { creator: true; assignees: true; tags: true };
}>;

export type IssueLocation = Pick<BroadcastableIssue, "status" | "customColumnId">;

export default class IssueBroadcastService {
    static async issue_created(projectId: string, issue: BroadcastableIssue) {
        await publisher().publish_message(
            publisher().get_channel_name(projectId),
            JSON.stringify({
                type: OutboundSocketMessageType.ISSUE_CREATED,
                projectId,
                payload: issue,
            }),
        );
    }

    static async issue_updated(
        projectId: string,
        issue: BroadcastableIssue,
        previous: IssueLocation,
    ) {
        await publisher().publish_message(
            publisher().get_channel_name(projectId),
            JSON.stringify({
                type: OutboundSocketMessageType.ISSUE_UPDATED,
                projectId,
                payload: issue,
                previous: { status: previous.status, customColumnId: previous.customColumnId },
            }),
        );
    }
}
