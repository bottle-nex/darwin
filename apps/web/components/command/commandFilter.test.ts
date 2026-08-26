import { describe, expect, test } from "bun:test";
import { defaultFilter } from "cmdk";

import { type CommandEntry, CommandKind } from "@/types/command.type";

import { commandEntryValue, type CommandGroupEntries, filterCommandGroups } from "./commandFilter";

function entry(kind: CommandKind, label: string, combo: string): CommandEntry {
    return { kind, label, combo, icon: (() => null) as never, run: () => {} };
}

const openGroup: CommandGroupEntries = {
    kind: CommandKind.Open,
    entries: [
        entry(CommandKind.Open, "Kanban", "o k"),
        entry(CommandKind.Open, "Gantt", "o g"),
        entry(CommandKind.Open, "Chats", "o c"),
    ],
};

const newGroup: CommandGroupEntries = {
    kind: CommandKind.New,
    entries: [
        entry(CommandKind.New, "New Issue", "n i"),
        entry(CommandKind.New, "New Project", "n p"),
    ],
};

const deleteGroup: CommandGroupEntries = {
    kind: CommandKind.Delete,
    entries: [entry(CommandKind.Delete, "Tag", "d t")],
};

const groups = [openGroup, newGroup, deleteGroup];

const labelsIn = (result: CommandGroupEntries[], kind: CommandKind) =>
    result.find((group) => group.kind === kind)?.entries.map((item) => item.label) ?? [];

describe("filterCommandGroups", () => {
    test("returns the groups untouched when there is no query", () => {
        expect(filterCommandGroups(groups, "")).toBe(groups);
    });

    test("drops groups that have no surviving entry", () => {
        const result = filterCommandGroups(groups, "kanban");
        expect(result.map((group) => group.kind)).toEqual([CommandKind.Open]);
        expect(labelsIn(result, CommandKind.Open)).toEqual(["Kanban"]);
    });

    test("returns nothing when the query matches no entry", () => {
        expect(filterCommandGroups(groups, "zzzqqq")).toEqual([]);
    });

    test("orders entries within a group by descending score", () => {
        const result = filterCommandGroups(groups, "new project");
        const labels = labelsIn(result, CommandKind.New);
        expect(labels[0]).toBe("New Project");
    });

    test("orders groups by their best entry score", () => {
        const result = filterCommandGroups(groups, "tag");
        expect(result[0]?.kind).toBe(CommandKind.Delete);
    });

    test("keeps source order for entries that score equally", () => {
        const equal: CommandGroupEntries[] = [
            {
                kind: CommandKind.Open,
                entries: [
                    entry(CommandKind.Open, "Alpha", "x a"),
                    entry(CommandKind.Open, "Alpha", "x b"),
                    entry(CommandKind.Open, "Alpha", "x c"),
                ],
            },
        ];
        const result = filterCommandGroups(equal, "alpha");
        expect(labelsIn(result, CommandKind.Open).length).toBe(3);
        expect(result[0]?.entries.map((item) => item.combo)).toEqual(["x a", "x b", "x c"]);
    });

    test("matches on the key combo, not just the label", () => {
        const result = filterCommandGroups(groups, "o c");
        expect(labelsIn(result, CommandKind.Open)).toContain("Chats");
    });

    test("never mutates the groups it was given", () => {
        const combos = openGroup.entries.map((item) => item.combo);
        filterCommandGroups(groups, "chats");
        expect(openGroup.entries.map((item) => item.combo)).toEqual(combos);
    });

    test.each(["k", "kan", "new", "tag", "o c", "issue", "zzz"])(
        "keeps exactly what cmdk's own filter would keep for %p",
        (query) => {
            const kept = filterCommandGroups(groups, query)
                .flatMap((group) => group.entries)
                .map(commandEntryValue)
                .sort();
            const expected = groups
                .flatMap((group) => group.entries)
                .filter((item) => defaultFilter(commandEntryValue(item), query) > 0)
                .map(commandEntryValue)
                .sort();
            expect(kept).toEqual(expected);
        },
    );
});
