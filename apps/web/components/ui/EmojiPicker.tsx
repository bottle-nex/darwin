"use client";

import { useMemo, useState } from "react";
import { EMOJI_GROUPS, QUICK_REACTION_EMOJIS } from "@trymatcha/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ALL_EMOJIS = EMOJI_GROUPS.flatMap((group) => group.emojis);

function EmojiButton({
    emoji,
    label,
    onSelect,
}: {
    emoji: string;
    label: string;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onSelect}
            className="flex size-7 cursor-pointer items-center justify-center rounded text-[19px] leading-none transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
        >
            {emoji}
        </button>
    );
}

export default function EmojiPicker({
    children,
    onSelect,
    align = "start",
}: {
    children: React.ReactNode;
    onSelect: (emoji: string) => void;
    align?: "start" | "center" | "end";
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const matches = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return needle ? ALL_EMOJIS.filter((emoji) => emoji.n.includes(needle)) : null;
    }, [query]);

    function select(emoji: string) {
        onSelect(emoji);
        setOpen(false);
        setQuery("");
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent
                align={align}
                aria-label="Choose an emoji"
                className="flex h-92 w-72 flex-col overflow-hidden border-white/10 bg-neutral-900 p-0 text-neutral-100"
            >
                <div className="border-b border-white/10 px-2.5 py-2">
                    <p className="mb-1.5 text-[11px] text-neutral-500">Quick reactions</p>
                    <div className="flex gap-0.5">
                        {QUICK_REACTION_EMOJIS.map((emoji) => (
                            <EmojiButton
                                key={emoji}
                                emoji={emoji}
                                label={`React with ${emoji}`}
                                onSelect={() => select(emoji)}
                            />
                        ))}
                    </div>
                </div>
                <input
                    autoFocus
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search emoji..."
                    className="w-full shrink-0 border-b border-white/10 bg-transparent px-3.5 py-2.5 text-[13px] text-neutral-100 outline-none placeholder:text-neutral-500"
                />
                <div
                    className="min-h-0 flex-1 overflow-y-auto p-1.5 no-scrollbar"
                    data-lenis-prevent
                >
                    {(matches ?? ALL_EMOJIS).length === 0 ? (
                        <p className="py-10 text-center text-[13px] text-neutral-500">
                            No results for “{query}”.
                        </p>
                    ) : matches ? (
                        <div className="grid grid-cols-[repeat(8,minmax(0,1fr))] gap-0.5">
                            {matches.map((emoji) => (
                                <EmojiButton
                                    key={emoji.c}
                                    emoji={emoji.c}
                                    label={`:${emoji.n}:`}
                                    onSelect={() => select(emoji.c)}
                                />
                            ))}
                        </div>
                    ) : (
                        EMOJI_GROUPS.map((group) => (
                            <section key={group.name}>
                                <h3 className="px-1 pt-2.5 pb-1 text-[11px] text-neutral-500">
                                    {group.name}
                                </h3>
                                <div className="grid grid-cols-[repeat(8,minmax(0,1fr))] gap-0.5">
                                    {group.emojis.map((emoji) => (
                                        <EmojiButton
                                            key={emoji.c}
                                            emoji={emoji.c}
                                            label={`:${emoji.n}:`}
                                            onSelect={() => select(emoji.c)}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
