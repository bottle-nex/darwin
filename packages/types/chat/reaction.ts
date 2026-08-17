import { EMOJI_GROUPS } from "./emojis";

export type ReactionSummary = {
    emoji: string;
    count: number;
    reactedByViewer: boolean;
};

export type ReactionDelta = {
    emoji: string;
    countDelta: number;
    reactedByViewer: boolean;
};

export type ReactionSelection = {
    reactions: ReactionSummary[];
    updates: ReactionSummary[];
    rollback: ReactionDelta[];
};

export const QUICK_REACTION_EMOJIS = ["👍", "❤️", "😂", "🎉", "😕", "👀"] as const;

export const CHAT_REACTION_EMOJIS = new Set(
    EMOJI_GROUPS.flatMap((group) => group.emojis.map((emoji) => emoji.c)),
);

/** True only for an emoji offered by the shared chat picker. */
export function is_reaction_emoji(value: string): boolean {
    return CHAT_REACTION_EMOJIS.has(value);
}

/** Applies absolute counts received from the real-time server. */
export function apply_reaction_updates(
    reactions: ReactionSummary[],
    updates: ReactionSummary[],
): ReactionSummary[] {
    return updates.reduce((next, update) => {
        const index = next.findIndex((reaction) => reaction.emoji === update.emoji);
        if (update.count <= 0) {
            return index === -1 ? next : next.filter((_, current_index) => current_index !== index);
        }
        if (index === -1) return [...next, update];
        return next.map((reaction, current_index) => (current_index === index ? update : reaction));
    }, reactions);
}

/** Applies a local count change without overwriting unrelated real-time updates. */
export function apply_reaction_deltas(
    reactions: ReactionSummary[],
    deltas: ReactionDelta[],
): ReactionSummary[] {
    return deltas.reduce((next, delta) => {
        const current = next.find((reaction) => reaction.emoji === delta.emoji);
        return apply_reaction_updates(next, [
            {
                emoji: delta.emoji,
                count: Math.max(0, (current?.count ?? 0) + delta.countDelta),
                reactedByViewer: delta.reactedByViewer,
            },
        ]);
    }, reactions);
}

/** Selects one viewer reaction, replacing their prior selection when present. */
export function get_reaction_selection(
    reactions: ReactionSummary[],
    emoji: string,
): ReactionSelection {
    const selected = reactions.find((reaction) => reaction.reactedByViewer);
    const deltas: ReactionDelta[] =
        selected?.emoji === emoji
            ? [{ emoji, countDelta: -1, reactedByViewer: false }]
            : [
                  ...(selected
                      ? [{ emoji: selected.emoji, countDelta: -1, reactedByViewer: false }]
                      : []),
                  { emoji, countDelta: 1, reactedByViewer: true },
              ];
    const next = apply_reaction_deltas(reactions, deltas);

    return {
        reactions: next,
        updates: deltas.map((delta) => {
            const reaction = next.find((current) => current.emoji === delta.emoji);
            return (
                reaction ?? {
                    emoji: delta.emoji,
                    count: 0,
                    reactedByViewer: delta.reactedByViewer,
                }
            );
        }),
        rollback: deltas.map((delta) => ({
            ...delta,
            countDelta: -delta.countDelta,
            reactedByViewer: !delta.reactedByViewer,
        })),
    };
}
