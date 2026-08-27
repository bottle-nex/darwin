"use client";

import { useMemo, useState } from "react";
import { MdCheck } from "react-icons/md";
import { ICONS } from "@trymatcha/ui/icons";

import { ColorPicker } from "@/components/ui/color-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EMOJI_GROUPS } from "@/data/emojis_bulk";
import { cn } from "@/lib/utils";

export type IconPick =
    { kind: "icon"; name: string; color: string } | { kind: "emoji"; char: string };

export function IconPickGlyph({ pick, className }: { pick: IconPick; className?: string }) {
    if (pick.kind === "emoji") {
        return <span className={cn("leading-none", className)}>{pick.char}</span>;
    }

    const Glyph = ICONS[pick.name as keyof typeof ICONS];
    return Glyph ? <Glyph className={className} style={{ color: pick.color }} /> : null;
}

const SWATCHES = [
    "#d4d4d4",
    "#8b8b8b",
    "#6366f1",
    "#2dd4bf",
    "#4ade80",
    "#eab308",
    "#f97316",
    "#f9a8d4",
    "#ef4444",
];

const WHEEL =
    "conic-gradient(from 0deg, #ef4444, #eab308, #4ade80, #2dd4bf, #6366f1, #a855f7, #ef4444)";

const RECENTS_CAP = 14;

const ICON_LIST = Object.entries(ICONS);
const ALL_EMOJIS = EMOJI_GROUPS.flatMap((group) => group.emojis);
const EMOJI_NAMES = new Map(ALL_EMOJIS.map((emoji) => [emoji.c, emoji.n]));

const GRID =
    "grid grid-cols-[repeat(6,minmax(0,1fr))] gap-0.5 sm:grid-cols-[repeat(8,minmax(0,1fr))]";

const SEARCH =
    "w-full shrink-0 border-b bg-transparent px-3.5 py-2.5 text-[13px] text-neutral-100 outline-none placeholder:text-neutral-500";

const SCROLL = "min-h-0 flex-1 overflow-y-auto p-1.5 no-scrollbar";

function Cell({
    title,
    onClick,
    children,
}: {
    title: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            className="flex size-7 cursor-pointer items-center justify-center rounded transition-colors hover:bg-white/10"
        >
            {children}
        </button>
    );
}

function Empty({ query }: { query: string }) {
    return (
        <p className="py-10 text-center text-[13px] text-neutral-500">No results for “{query}”.</p>
    );
}

function IconsTab({ onPick }: { onPick: (pick: IconPick) => void }) {
    const [color, setColor] = useState(SWATCHES[0]);
    const [query, setQuery] = useState("");

    const matches = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return ICON_LIST;
        return ICON_LIST.filter(([name]) => name.includes(needle));
    }, [query]);

    return (
        <>
            <div className="flex shrink-0 items-center gap-1.5 border-b px-3 py-2">
                {SWATCHES.map((swatch) => (
                    <button
                        key={swatch}
                        type="button"
                        aria-label={swatch}
                        onClick={() => setColor(swatch)}
                        style={{ background: swatch }}
                        className="flex size-4.75 aspect-square cursor-pointer items-center justify-center rounded-full"
                    >
                        {color === swatch && <MdCheck className="size-3.5 text-neutral-900" />}
                    </button>
                ))}

                <div className="mx-0.5 h-5 w-px bg-white/10" />

                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            aria-label="Custom color"
                            style={{ background: WHEEL }}
                            className="size-4.75 aspect-square cursor-pointer rounded-full"
                        />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                        <ColorPicker value={color} onChange={setColor} />
                    </PopoverContent>
                </Popover>
            </div>

            <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search icons..."
                className={SEARCH}
            />

            <div className={SCROLL} data-lenis-prevent>
                {matches.length === 0 ? (
                    <Empty query={query} />
                ) : (
                    <div className={GRID}>
                        {matches.map(([name, Icon]) => (
                            <Cell
                                key={name}
                                title={name}
                                onClick={() => onPick({ kind: "icon", name, color })}
                            >
                                <Icon className="size-4.5" style={{ color }} />
                            </Cell>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function EmojisTab({ recents, onPick }: { recents: string[]; onPick: (pick: IconPick) => void }) {
    const [query, setQuery] = useState("");

    const matches = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return null;
        return ALL_EMOJIS.filter((emoji) => emoji.n.includes(needle));
    }, [query]);

    const groups = useMemo(() => {
        if (recents.length === 0) return EMOJI_GROUPS;
        const frequent = {
            name: "Frequently used",
            emojis: recents.map((char) => ({ c: char, n: EMOJI_NAMES.get(char) ?? char })),
        };
        return [frequent, ...EMOJI_GROUPS];
    }, [recents]);

    return (
        <>
            <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search emoji..."
                className={SEARCH}
            />

            <div className={SCROLL} data-lenis-prevent>
                {matches === null ? (
                    groups.map((group) => (
                        <section key={group.name}>
                            <h3 className="px-1 pt-2.5 pb-1 text-[11px] text-neutral-500">
                                {group.name}
                            </h3>
                            <div className={GRID}>
                                {group.emojis.map((emoji) => (
                                    <Cell
                                        key={`${group.name}-${emoji.c}`}
                                        title={`:${emoji.n}:`}
                                        onClick={() => onPick({ kind: "emoji", char: emoji.c })}
                                    >
                                        <span className="text-[19px] leading-none">{emoji.c}</span>
                                    </Cell>
                                ))}
                            </div>
                        </section>
                    ))
                ) : matches.length === 0 ? (
                    <Empty query={query} />
                ) : (
                    <div className={GRID}>
                        {matches.map((emoji) => (
                            <Cell
                                key={emoji.c}
                                title={`:${emoji.n}:`}
                                onClick={() => onPick({ kind: "emoji", char: emoji.c })}
                            >
                                <span className="text-[19px] leading-none">{emoji.c}</span>
                            </Cell>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default function IconPicker({
    open,
    onOpenChange,
    onSelect,
    align = "start",
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (pick: IconPick) => void;
    align?: "start" | "center" | "end";
    children: React.ReactNode;
}) {
    const [tab, setTab] = useState<"icons" | "emojis">("icons");
    const [recents, setRecents] = useState<string[]>([]);

    function handlePick(pick: IconPick) {
        if (pick.kind === "emoji") {
            setRecents((previous) =>
                [pick.char, ...previous.filter((char) => char !== pick.char)].slice(0, RECENTS_CAP),
            );
        }
        onSelect(pick);
        onOpenChange(false);
    }

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>

            <PopoverContent
                align={align}
                aria-label="Pick an icon or emoji"
                className="flex h-92 w-72 flex-col overflow-hidden p-0 text-neutral-100"
            >
                <div className="flex shrink-0 gap-0.5 border-b px-2">
                    {(["icons", "emojis"] as const).map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setTab(value)}
                            className={cn(
                                "relative cursor-pointer px-2.5 py-2.5 text-[13px] capitalize transition-colors",
                                tab === value
                                    ? "text-neutral-100"
                                    : "text-neutral-500 hover:text-neutral-300",
                            )}
                        >
                            {value}
                            {tab === value && (
                                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
                            )}
                        </button>
                    ))}
                </div>

                {tab === "icons" ? (
                    <IconsTab key="icons" onPick={handlePick} />
                ) : (
                    <EmojisTab key="emojis" recents={recents} onPick={handlePick} />
                )}
            </PopoverContent>
        </Popover>
    );
}
