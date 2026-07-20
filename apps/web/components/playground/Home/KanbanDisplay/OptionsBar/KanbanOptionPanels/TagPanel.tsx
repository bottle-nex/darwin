"use client";
import { useState } from "react";
import { MdCheck, MdSearch, MdLabel } from "react-icons/md";
import { DropdownMenu } from "radix-ui";
import { cn } from "@/lib/utils";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useListTags } from "@/hooks/tags/useListTags";
import TagDisplay from "@/components/playground/Home/TagsDisplay/TagDisplay";
import OptionButton from "./OptionButton";
import { TooltipComponent } from "@/components/ui/tooltip-component";

type TagPanelProps = {
    /** Tag ids, not names — names are renameable and collide across projects. */
    selected: string[];
    onToggle: (id: string) => void;
    onClear: () => void;
};

// Same dark popover as the other panels, but without padding (the header,
// divider, and scroll area manage their own) and clipped so corners stay round.
export const TAG_PANEL_CONTENT =
    "z-50 flex max-h-76 w-60 flex-col overflow-hidden origin-(--radix-dropdown-menu-content-transform-origin) rounded-lg border border-neutral-800 bg-charcoal shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95";

/**
 * The panel's rows on their own, so they can also be rendered inside a submenu.
 * The search query lives here because Radix unmounts the content on close, which
 * resets it for free.
 */
export function TagPanelItems({ selected, onToggle, onClear }: TagPanelProps) {
    const [query, setQuery] = useState("");
    const projectId = useActiveProject()?.id;
    const { data: allTags } = useListTags(projectId);
    const tags = (allTags ?? []).filter((t) =>
        t.name.toLowerCase().includes(query.trim().toLowerCase()),
    );

    return (
        <>
            <div className="flex shrink-0 flex-col gap-1.5 p-2">
                <div className="flex items-center justify-between px-0.5">
                    <span className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                        Filter by tag
                    </span>
                    {selected.length > 0 && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="cursor-pointer bg-transparent text-[11px] font-medium text-neutral-400 hover:text-neutral-100"
                        >
                            Clear all
                        </button>
                    )}
                </div>
                <div className="relative">
                    <MdSearch
                        className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-neutral-500"
                        aria-hidden
                    />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder="Search tags..."
                        className="h-7 w-full rounded-md border border-white/10 bg-white/5 pr-2 pl-7 text-[12px] text-neutral-100 placeholder:text-neutral-500 focus:border-white/25 focus:outline-none"
                    />
                </div>
            </div>

            <div className="h-px shrink-0 bg-white/5" />

            {/* Scrollable checklist. */}
            <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto p-1">
                {tags.length === 0 ? (
                    <p className="px-2 py-3 text-center text-[12px] text-neutral-600">No tags</p>
                ) : (
                    tags.map((tag) => {
                        const isOn = selected.includes(tag.id);
                        return (
                            <DropdownMenu.CheckboxItem
                                key={tag.id}
                                checked={isOn}
                                onCheckedChange={() => onToggle(tag.id)}
                                onSelect={(e) => e.preventDefault()}
                                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none select-none data-highlighted:bg-white/5"
                            >
                                <span
                                    className={cn(
                                        "flex size-3.5 shrink-0 items-center justify-center rounded border transition-colors",
                                        isOn
                                            ? "border-neutral-200 bg-neutral-200 text-neutral-900"
                                            : "border-white/25",
                                    )}
                                >
                                    {isOn && <MdCheck className="size-2.5" aria-hidden />}
                                </span>
                                <TagDisplay name={tag.name} color={tag.color} />
                            </DropdownMenu.CheckboxItem>
                        );
                    })
                )}
            </div>
        </>
    );
}

/**
 * Tag filter. A sticky header (title + Clear all, then a tag search) sits above a
 * divider; only the checklist below scrolls. Selecting keeps the menu open so
 * several tags can be toggled at once, and narrows the board to issues carrying
 * any selected tag.
 */
export default function TagPanel({ selected, onToggle, onClear }: TagPanelProps) {
    return (
        <DropdownMenu.Root>
            <TooltipComponent delayDuration={1000} content="Tag" side="bottom">
                <DropdownMenu.Trigger asChild>
                    <OptionButton label="Tag" icon={MdLabel} active={selected.length > 0} />
                </DropdownMenu.Trigger>
            </TooltipComponent>
            <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" sideOffset={6} className={TAG_PANEL_CONTENT}>
                    <TagPanelItems selected={selected} onToggle={onToggle} onClear={onClear} />
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
