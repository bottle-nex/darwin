import { defaultFilter } from "@/components/ui/command";
import type { CommandEntry, CommandKind } from "@/types/command.type";

export interface CommandGroupEntries {
    kind: CommandKind;
    entries: CommandEntry[];
}

export function commandEntryValue(entry: CommandEntry) {
    return `${entry.kind} ${entry.label} ${entry.combo}`;
}

export function filterCommandGroups(
    groups: CommandGroupEntries[],
    query: string,
): CommandGroupEntries[] {
    if (!query) return groups;

    const scored = groups.flatMap((group) => {
        const entries = group.entries
            .map((entry) => ({
                entry,
                score: defaultFilter(commandEntryValue(entry), query),
            }))
            .filter((candidate) => candidate.score > 0)
            .sort((a, b) => b.score - a.score);

        if (!entries.length) return [];
        return [
            {
                group: { kind: group.kind, entries: entries.map((candidate) => candidate.entry) },
                score: entries[0]!.score,
            },
        ];
    });

    return scored.sort((a, b) => b.score - a.score).map((candidate) => candidate.group);
}
