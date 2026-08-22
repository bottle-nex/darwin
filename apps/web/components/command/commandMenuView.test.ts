import { describe, expect, test } from "bun:test";
import { commandMenuView, type CommandMenuViewInput } from "./commandMenuView";

const idle: CommandMenuViewInput = {
    commandGroupCount: 4,
    searchArmed: false,
    searchSettled: false,
    hasResult: false,
    hasHits: false,
    isError: false,
};

const view = (overrides: Partial<CommandMenuViewInput>) =>
    commandMenuView({ ...idle, ...overrides });

describe("commandMenuView", () => {
    test("shows only commands when the menu just opened", () => {
        expect(view({})).toEqual({ showSearchGroups: false, showNoResults: false });
    });

    test("shows no search groups for a one-character query", () => {
        expect(view({ commandGroupCount: 2 })).toMatchObject({ showSearchGroups: false });
    });

    test("stays quiet while the query is still debouncing", () => {
        expect(view({ commandGroupCount: 0, searchArmed: true })).toEqual({
            showSearchGroups: true,
            showNoResults: false,
        });
    });

    test("stays quiet while the request is in flight", () => {
        expect(view({ commandGroupCount: 0, searchArmed: true, searchSettled: true })).toEqual({
            showSearchGroups: true,
            showNoResults: false,
        });
    });

    test("says nothing was found once a settled search returns zero hits", () => {
        expect(
            view({
                commandGroupCount: 0,
                searchArmed: true,
                searchSettled: true,
                hasResult: true,
            }),
        ).toEqual({ showSearchGroups: true, showNoResults: true });
    });

    test("leaves the not-found line out when the search errored", () => {
        expect(
            view({
                commandGroupCount: 0,
                searchArmed: true,
                searchSettled: true,
                hasResult: true,
                isError: true,
            }),
        ).toEqual({ showSearchGroups: true, showNoResults: false });
    });

    test("leaves the not-found line out when there are hits", () => {
        expect(
            view({
                commandGroupCount: 0,
                searchArmed: true,
                searchSettled: true,
                hasResult: true,
                hasHits: true,
            }),
        ).toEqual({ showSearchGroups: true, showNoResults: false });
    });

    test("leaves the not-found line out when commands still match", () => {
        expect(
            view({
                commandGroupCount: 1,
                searchArmed: true,
                searchSettled: true,
                hasResult: true,
            }),
        ).toEqual({ showSearchGroups: true, showNoResults: false });
    });

    test("says nothing was found when a short query matches no command", () => {
        expect(view({ commandGroupCount: 0 })).toEqual({
            showSearchGroups: false,
            showNoResults: true,
        });
    });

    test("never shows both a hit list and the not-found line", () => {
        for (const searchArmed of [false, true]) {
            for (const searchSettled of [false, true]) {
                for (const hasResult of [false, true]) {
                    for (const hasHits of [false, true]) {
                        for (const isError of [false, true]) {
                            for (const commandGroupCount of [0, 3]) {
                                const result = commandMenuView({
                                    commandGroupCount,
                                    searchArmed,
                                    searchSettled,
                                    hasResult,
                                    hasHits,
                                    isError,
                                });
                                if (hasHits || commandGroupCount > 0) {
                                    expect(result.showNoResults).toBe(false);
                                }
                            }
                        }
                    }
                }
            }
        }
    });
});
