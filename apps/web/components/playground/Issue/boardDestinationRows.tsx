"use client";
import { SpaceEntityIcon } from "@trydarwin/ui/icons";
import type { ComponentType, ReactNode } from "react";

import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import { IconPickGlyph } from "@/components/ui/IconPicker";
import type { BoardDestinations } from "@/hooks/issues/useBoardDestinations";

const ICON = "size-3.5 shrink-0 text-overlay/50";

export const MOVE_EMPTY_LABEL = "No other boards";

type RowProps = {
    disabled?: boolean;
    onSelect: () => void;
    className?: string;
    children: ReactNode;
};

/**
 * A column sits under its space's heading, marked by a small dot the way a nested
 * list item is. `pl-4` plus the 4px dot and the item's own 8px gap lands the label
 * at 28px — directly beneath the heading's text, which clears 8px of menu padding,
 * a 14px icon and a 6px gap. The row keeps its full-width highlight either way.
 */
const CHILD_ROW = "pl-4";

/**
 * The move-to list, built once. A context menu cannot host a command item and a
 * command list cannot host a context-menu item, so the host passes its own two
 * primitives — order, headings, icons, labels and the empty row are decided here
 * and nowhere else.
 */
export function boardDestinationRows({
    destinations,
    disabled,
    onPick,
    Item,
    Heading,
}: {
    destinations: BoardDestinations;
    disabled?: boolean;
    onPick: (columnId: string | null) => void;
    Item: ComponentType<RowProps>;
    /** Renders a space heading in the host's own style. */
    Heading: ComponentType<{ icon: ReactNode; name: string; children: ReactNode }>;
}): ReactNode {
    if (destinations.isEmpty) {
        return (
            <Item disabled onSelect={() => {}}>
                {MOVE_EMPTY_LABEL}
            </Item>
        );
    }

    return (
        <>
            {destinations.agentBoard && (
                <Item disabled={disabled} onSelect={() => onPick(null)}>
                    <HeroBuddy move={false} className="size-3.5 shrink-0" />
                    <span className="flex-1 truncate">Agent board</span>
                </Item>
            )}
            {destinations.spaces.map((space) => (
                <Heading
                    key={space.id}
                    name={space.name}
                    icon={
                        space.icon ? (
                            <IconPickGlyph pick={space.icon} className={ICON} />
                        ) : (
                            <SpaceEntityIcon className={ICON} aria-hidden />
                        )
                    }
                >
                    {space.columns.map((column) => (
                        <Item
                            key={column.id}
                            disabled={disabled}
                            onSelect={() => onPick(column.id)}
                            className={CHILD_ROW}
                        >
                            <span
                                className="size-1 shrink-0 rounded-full bg-overlay/25"
                                aria-hidden
                            />
                            <span className="flex-1 truncate">{column.label}</span>
                        </Item>
                    ))}
                </Heading>
            ))}
        </>
    );
}
