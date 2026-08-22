import type { MessageReference } from "../prisma/schemas.prisma";

export interface ChatPreviewMessage {
    id: string;
    message: string;
    isDeleted: boolean;
    references: MessageReference[];
    createdAt: Date;
}

export interface TeamConversationPreview {
    teamId: string;
    latestMessage: ChatPreviewMessage | null;
}

export interface ChatConversationPreviews {
    project: ChatPreviewMessage | null;
    teams: TeamConversationPreview[];
}
