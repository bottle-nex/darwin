"use client";
import { BackChevronIcon, CloseIcon, type IconType, SearchIcon } from "@trydarwin/ui/icons";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import IconWrapper from "@/components/ui/IconWrapper";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Both states are always mounted and cross-fade in place: the left and right
// 28px slots never move, so nothing reflows when the row turns into a search bar.
const SLOT = "flex size-7 shrink-0 items-center justify-center rounded-[6px]";
const FADE = "transition-opacity duration-200 ease-out";

/**
 * The header a sidebar pane shows in place of the project switcher: back, and a search that
 * expands over it.
 *
 * Shared by Settings and Darwin — everything here is generic except `label`, which names what is
 * being searched, and `action`, an optional button sitting left of the search icon for the one
 * thing a pane is most often opened to do.
 *
 * @example
 * <SidebarSearchRow label="chats" value={query} onChange={setQuery} onBack={...} onSubmit={...}
 *     action={{ icon: AddIcon, label: "New chat", onClick: startNewChat }} />
 */
export default function SidebarSearchRow({
    label,
    value,
    onChange,
    onBack,
    onSubmit,
    action,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onBack: () => void;
    onSubmit: () => void;
    action?: { icon: IconType; label: string; onClick: () => void };
}) {
    const [searching, setSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function openSearch() {
        setSearching(true);
        requestAnimationFrame(() => inputRef.current?.focus());
    }

    function closeSearch() {
        onChange("");
        setSearching(false);
    }

    return (
        <div className="relative h-7 w-full">
            {/* Browse state */}
            <div
                aria-hidden={searching}
                className={cn(
                    "absolute inset-0 flex items-center justify-between gap-1",
                    FADE,
                    searching && "pointer-events-none opacity-0",
                )}
            >
                <Button
                    variant="unstyled"
                    type="button"
                    onClick={onBack}
                    tabIndex={searching ? -1 : 0}
                    className="flex h-7 cursor-pointer items-center gap-0.5 rounded-full pl-1.75 pr-3.25 text-[12.5px] text-overlay/80 transition-colors hover:bg-active hover:text-overlay/90"
                >
                    <BackChevronIcon className="size-4 shrink-0" aria-hidden />
                    Back
                </Button>

                <div className="flex shrink-0 items-center gap-0.5">
                    {action && (
                        <Button
                            variant="unstyled"
                            type="button"
                            onClick={action.onClick}
                            aria-label={action.label}
                            title={action.label}
                            tabIndex={searching ? -1 : 0}
                            className={cn(SLOT, "cursor-pointer")}
                        >
                            <IconWrapper
                                icon={action.icon}
                                variant="ghost"
                                className="size-7 rounded-[6px]"
                                iconClassName="size-4"
                            />
                        </Button>
                    )}

                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={openSearch}
                        aria-label={`Search ${label}`}
                        tabIndex={searching ? -1 : 0}
                        className={cn(SLOT, "cursor-pointer")}
                    >
                        <IconWrapper
                            icon={SearchIcon}
                            variant="ghost"
                            className="size-7 rounded-[6px]"
                            iconClassName="size-4"
                        />
                    </Button>
                </div>
            </div>

            {/* Search state */}
            <div
                aria-hidden={!searching}
                className={cn(
                    "absolute inset-0",
                    FADE,
                    !searching && "pointer-events-none opacity-0",
                )}
            >
                <SearchIcon
                    className="pointer-events-none absolute top-1/2 left-1.5 size-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                />
                <Input
                    ref={inputRef}
                    variant="ghost"
                    value={value}
                    tabIndex={searching ? 0 : -1}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            event.preventDefault();
                            if (value) {
                                onChange("");
                                return;
                            }
                            closeSearch();
                            return;
                        }
                        if (event.key === "Enter") {
                            event.preventDefault();
                            onSubmit();
                        }
                    }}
                    placeholder={`Search ${label}...`}
                    className="h-7 rounded-[6px] bg-overlay/5 pr-8 pl-7 text-[12.5px] hover:bg-overlay/7"
                />
                <Button
                    variant="unstyled"
                    type="button"
                    onClick={closeSearch}
                    aria-label="Close search"
                    tabIndex={searching ? 0 : -1}
                    className={cn(
                        SLOT,
                        "absolute top-0 right-0 cursor-pointer text-neutral-400 transition-colors hover:text-neutral-100",
                    )}
                >
                    <CloseIcon className="size-4" aria-hidden />
                </Button>
            </div>
        </div>
    );
}
