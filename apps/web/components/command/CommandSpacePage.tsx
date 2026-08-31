"use client";
import { CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import type { SpaceCommandActions } from "@/hooks/spaces/useSpaceActions";
import { DATE_SHORTCUTS_WITH_CLEAR } from "@/lib/dateShortcuts";
import type { SpaceCommandPage } from "@/types/command.type";

export const SPACE_PAGE_TITLE: Record<SpaceCommandPage, string> = {
    "space-dates": "Set dates",
};

export default function CommandSpacePage({
    page,
    actions,
    onDone,
}: {
    page: SpaceCommandPage;
    actions: SpaceCommandActions;
    onDone: () => void;
}) {
    const { editable, count } = actions;
    if (!count) return null;

    function pick(run: () => void, closes = true) {
        run();
        if (closes) onDone();
    }

    return (
        <CommandList data-lenis-prevent>
            <CommandEmpty>No matches.</CommandEmpty>

            {page === "space-dates" && (
                <>
                    <CommandGroup heading="Start date">
                        {DATE_SHORTCUTS_WITH_CLEAR.map((shortcut) => (
                            <CommandItem
                                key={`start-${shortcut.label}`}
                                value={`start ${shortcut.label}`}
                                disabled={!editable}
                                onSelect={() =>
                                    pick(() => actions.setStartDate(shortcut.resolve()))
                                }
                                className="justify-between"
                            >
                                {shortcut.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandGroup heading="Target date">
                        {DATE_SHORTCUTS_WITH_CLEAR.map((shortcut) => (
                            <CommandItem
                                key={`target-${shortcut.label}`}
                                value={`target ${shortcut.label}`}
                                disabled={!editable}
                                onSelect={() =>
                                    pick(() => actions.setTargetDate(shortcut.resolve()))
                                }
                                className="justify-between"
                            >
                                {shortcut.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </>
            )}
        </CommandList>
    );
}
