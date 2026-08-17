import { describe, expect, test } from "bun:test";
import * as reaction from "./reaction";

const { is_reaction_emoji } = reaction;

describe("is_reaction_emoji", () => {
    test("accepts emojis exposed by the chat picker", () => {
        expect(is_reaction_emoji("👍")).toBe(true);
        expect(is_reaction_emoji("❤️")).toBe(true);
        expect(is_reaction_emoji("🎉")).toBe(true);
    });

    test("rejects arbitrary message text", () => {
        expect(is_reaction_emoji("thanks")).toBe(false);
        expect(is_reaction_emoji("👍 thanks")).toBe(false);
    });
});

describe("get_reaction_selection", () => {
    const reactions = [
        { emoji: "👍", count: 3, reactedByViewer: true },
        { emoji: "❤️", count: 1, reactedByViewer: false },
    ];

    test("adds a first viewer reaction", () => {
        const selection = reaction.get_reaction_selection([], "👀");

        expect(selection.updates).toEqual([{ emoji: "👀", count: 1, reactedByViewer: true }]);
        expect(selection.reactions).toEqual([{ emoji: "👀", count: 1, reactedByViewer: true }]);
    });

    test("replaces the viewer's selected emoji while preserving other reactions", () => {
        const selection = reaction.get_reaction_selection(reactions, "❤️");

        expect(selection.updates).toEqual([
            { emoji: "👍", count: 2, reactedByViewer: false },
            { emoji: "❤️", count: 2, reactedByViewer: true },
        ]);
        expect(selection.reactions).toEqual([
            { emoji: "👍", count: 2, reactedByViewer: false },
            { emoji: "❤️", count: 2, reactedByViewer: true },
        ]);
    });

    test("removes the viewer's emoji when they select it again", () => {
        const selection = reaction.get_reaction_selection(reactions, "👍");

        expect(selection.updates).toEqual([{ emoji: "👍", count: 2, reactedByViewer: false }]);
        expect(selection.reactions).toEqual([
            { emoji: "👍", count: 2, reactedByViewer: false },
            { emoji: "❤️", count: 1, reactedByViewer: false },
        ]);
    });

    test("emits a zero-count update when the viewer removes the only reaction", () => {
        const selection = reaction.get_reaction_selection(
            [{ emoji: "🎉", count: 1, reactedByViewer: true }],
            "🎉",
        );

        expect(selection.updates).toEqual([{ emoji: "🎉", count: 0, reactedByViewer: false }]);
        expect(selection.reactions).toEqual([]);
    });

    test("applies an inverse update without discarding an unrelated live count", () => {
        const optimistic = reaction.get_reaction_selection(reactions, "❤️");
        const live_reactions = reaction.apply_reaction_updates(optimistic.reactions, [
            { emoji: "❤️", count: 5, reactedByViewer: true },
        ]);

        const rolled_back = reaction.apply_reaction_deltas(live_reactions, optimistic.rollback);

        expect(rolled_back).toEqual([
            { emoji: "👍", count: 3, reactedByViewer: true },
            { emoji: "❤️", count: 4, reactedByViewer: false },
        ]);
    });
});
