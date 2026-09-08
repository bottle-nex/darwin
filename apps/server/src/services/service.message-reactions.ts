import { Prisma, prisma } from "@trydarwin/database";
import type { ReactionSummary } from "@trydarwin/types";

type ReactionGroup = { messageId: string; emoji: string; count: number };
type ReactionUpdate = {
    emoji: string;
    count: number;
    actorReacted: boolean;
};
type ReactionMutation = {
    updates: ReactionUpdate[];
    reactionId?: string;
};

export default class MessageReactionService {
    static async change_chat_reaction(chat_id: string, user_id: string, emoji: string) {
        return MessageReactionService.with_serializable_retry(() =>
            prisma.$transaction(
                async (transaction): Promise<ReactionMutation> => {
                    const existing = await transaction.chatReaction.findUnique({
                        where: { chatId_userId: { chatId: chat_id, userId: user_id } },
                        select: { id: true, emoji: true },
                    });
                    const is_removal = existing?.emoji === emoji;
                    const reaction = is_removal
                        ? null
                        : await transaction.chatReaction.upsert({
                              where: { chatId_userId: { chatId: chat_id, userId: user_id } },
                              update: { emoji },
                              create: { chatId: chat_id, userId: user_id, emoji },
                              select: { id: true },
                          });
                    if (is_removal && existing) {
                        await transaction.chatReaction.delete({ where: { id: existing.id } });
                    }

                    const affected_emojis =
                        existing && existing.emoji !== emoji ? [existing.emoji, emoji] : [emoji];
                    const groups = await transaction.chatReaction.groupBy({
                        by: ["emoji"],
                        where: { chatId: chat_id, emoji: { in: affected_emojis } },
                        _count: { _all: true },
                    });
                    const counts = new Map(groups.map((group) => [group.emoji, group._count._all]));

                    return {
                        updates: affected_emojis.map((affected_emoji) => ({
                            emoji: affected_emoji,
                            count: counts.get(affected_emoji) ?? 0,
                            actorReacted: !is_removal && affected_emoji === emoji,
                        })),
                        reactionId: reaction?.id,
                    };
                },
                { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
            ),
        );
    }

    static async change_project_chat_reaction(
        project_chat_id: string,
        user_id: string,
        emoji: string,
    ) {
        return MessageReactionService.with_serializable_retry(() =>
            prisma.$transaction(
                async (transaction): Promise<ReactionMutation> => {
                    const existing = await transaction.projectChatReaction.findUnique({
                        where: {
                            projectChatId_userId: {
                                projectChatId: project_chat_id,
                                userId: user_id,
                            },
                        },
                        select: { id: true, emoji: true },
                    });
                    const is_removal = existing?.emoji === emoji;
                    const reaction = is_removal
                        ? null
                        : await transaction.projectChatReaction.upsert({
                              where: {
                                  projectChatId_userId: {
                                      projectChatId: project_chat_id,
                                      userId: user_id,
                                  },
                              },
                              update: { emoji },
                              create: { projectChatId: project_chat_id, userId: user_id, emoji },
                              select: { id: true },
                          });
                    if (is_removal && existing) {
                        await transaction.projectChatReaction.delete({
                            where: { id: existing.id },
                        });
                    }

                    const affected_emojis =
                        existing && existing.emoji !== emoji ? [existing.emoji, emoji] : [emoji];
                    const groups = await transaction.projectChatReaction.groupBy({
                        by: ["emoji"],
                        where: { projectChatId: project_chat_id, emoji: { in: affected_emojis } },
                        _count: { _all: true },
                    });
                    const counts = new Map(groups.map((group) => [group.emoji, group._count._all]));

                    return {
                        updates: affected_emojis.map((affected_emoji) => ({
                            emoji: affected_emoji,
                            count: counts.get(affected_emoji) ?? 0,
                            actorReacted: !is_removal && affected_emoji === emoji,
                        })),
                        reactionId: reaction?.id,
                    };
                },
                { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
            ),
        );
    }

    static async change_team_chat_reaction(team_chat_id: string, user_id: string, emoji: string) {
        return MessageReactionService.with_serializable_retry(() =>
            prisma.$transaction(
                async (transaction): Promise<ReactionMutation> => {
                    const existing = await transaction.teamChatReaction.findUnique({
                        where: {
                            teamChatId_userId: {
                                teamChatId: team_chat_id,
                                userId: user_id,
                            },
                        },
                        select: { id: true, emoji: true },
                    });
                    const is_removal = existing?.emoji === emoji;
                    const reaction = is_removal
                        ? null
                        : await transaction.teamChatReaction.upsert({
                              where: {
                                  teamChatId_userId: {
                                      teamChatId: team_chat_id,
                                      userId: user_id,
                                  },
                              },
                              update: { emoji },
                              create: { teamChatId: team_chat_id, userId: user_id, emoji },
                              select: { id: true },
                          });
                    if (is_removal && existing) {
                        await transaction.teamChatReaction.delete({ where: { id: existing.id } });
                    }

                    const affected_emojis =
                        existing && existing.emoji !== emoji ? [existing.emoji, emoji] : [emoji];
                    const groups = await transaction.teamChatReaction.groupBy({
                        by: ["emoji"],
                        where: { teamChatId: team_chat_id, emoji: { in: affected_emojis } },
                        _count: { _all: true },
                    });
                    const counts = new Map(groups.map((group) => [group.emoji, group._count._all]));

                    return {
                        updates: affected_emojis.map((affected_emoji) => ({
                            emoji: affected_emoji,
                            count: counts.get(affected_emoji) ?? 0,
                            actorReacted: !is_removal && affected_emoji === emoji,
                        })),
                        reactionId: reaction?.id,
                    };
                },
                { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
            ),
        );
    }

    static async chat_summaries(chat_ids: string[], viewer_id: string) {
        if (chat_ids.length === 0) return new Map<string, ReactionSummary[]>();

        const [groups, viewer_reactions] = await Promise.all([
            prisma.chatReaction.groupBy({
                by: ["chatId", "emoji"],
                where: { chatId: { in: chat_ids } },
                _count: { _all: true },
            }),
            prisma.chatReaction.findMany({
                where: { chatId: { in: chat_ids }, userId: viewer_id },
                select: { chatId: true, emoji: true },
            }),
        ]);

        return MessageReactionService.to_summaries(
            groups.map((group) => ({
                messageId: group.chatId,
                emoji: group.emoji,
                count: group._count._all,
            })),
            viewer_reactions.map((reaction) => ({
                messageId: reaction.chatId,
                emoji: reaction.emoji,
            })),
        );
    }

    static async project_chat_summaries(chat_ids: string[], viewer_id: string) {
        if (chat_ids.length === 0) return new Map<string, ReactionSummary[]>();

        const [groups, viewer_reactions] = await Promise.all([
            prisma.projectChatReaction.groupBy({
                by: ["projectChatId", "emoji"],
                where: { projectChatId: { in: chat_ids } },
                _count: { _all: true },
            }),
            prisma.projectChatReaction.findMany({
                where: { projectChatId: { in: chat_ids }, userId: viewer_id },
                select: { projectChatId: true, emoji: true },
            }),
        ]);

        return MessageReactionService.to_summaries(
            groups.map((group) => ({
                messageId: group.projectChatId,
                emoji: group.emoji,
                count: group._count._all,
            })),
            viewer_reactions.map((reaction) => ({
                messageId: reaction.projectChatId,
                emoji: reaction.emoji,
            })),
        );
    }

    static async team_chat_summaries(chat_ids: string[], viewer_id: string) {
        if (chat_ids.length === 0) return new Map<string, ReactionSummary[]>();

        const [groups, viewer_reactions] = await Promise.all([
            prisma.teamChatReaction.groupBy({
                by: ["teamChatId", "emoji"],
                where: { teamChatId: { in: chat_ids } },
                _count: { _all: true },
            }),
            prisma.teamChatReaction.findMany({
                where: { teamChatId: { in: chat_ids }, userId: viewer_id },
                select: { teamChatId: true, emoji: true },
            }),
        ]);

        return MessageReactionService.to_summaries(
            groups.map((group) => ({
                messageId: group.teamChatId,
                emoji: group.emoji,
                count: group._count._all,
            })),
            viewer_reactions.map((reaction) => ({
                messageId: reaction.teamChatId,
                emoji: reaction.emoji,
            })),
        );
    }

    private static to_summaries(
        groups: ReactionGroup[],
        viewer_reactions: { messageId: string; emoji: string }[],
    ) {
        const viewer_keys = new Set(
            viewer_reactions.map((reaction) => `${reaction.messageId}:${reaction.emoji}`),
        );
        const summaries = new Map<string, ReactionSummary[]>();

        for (const group of groups) {
            const reactions = summaries.get(group.messageId) ?? [];
            reactions.push({
                emoji: group.emoji,
                count: group.count,
                reactedByViewer: viewer_keys.has(`${group.messageId}:${group.emoji}`),
            });
            summaries.set(group.messageId, reactions);
        }
        return summaries;
    }

    private static is_serialization_failure(error: unknown) {
        const codes = [
            (error as { code?: string }).code,
            (error as { cause?: { code?: string } }).cause?.code,
        ];
        return codes.includes("P2034") || codes.includes("40001");
    }

    private static async with_serializable_retry<T>(operation: () => Promise<T>): Promise<T> {
        let last_error: unknown;
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                return await operation();
            } catch (error) {
                last_error = error;
                if (!MessageReactionService.is_serialization_failure(error) || attempt === 2) {
                    throw error;
                }
            }
        }
        throw last_error;
    }
}
