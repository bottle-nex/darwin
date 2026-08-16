"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { cn } from "@/lib/utils";
import type { SlashCommandItem } from "./commandItems";

interface SlashCommandListProps {
    items: SlashCommandItem[];
    command: (item: SlashCommandItem) => void;
}

export interface SlashCommandListHandle {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const SlashCommandList = forwardRef<SlashCommandListHandle, SlashCommandListProps>(
    function SlashCommandList({ items, command }, ref) {
        const [selected, setSelected] = useState(0);

        useEffect(() => {
            setSelected(0);
        }, [items]);

        useImperativeHandle(ref, () => ({
            onKeyDown({ event }) {
                if (!items.length) return false;

                if (event.key === "ArrowDown") {
                    setSelected((prev) => (prev + 1) % items.length);
                    return true;
                }

                if (event.key === "ArrowUp") {
                    setSelected((prev) => (prev - 1 + items.length) % items.length);
                    return true;
                }

                if (event.key === "Enter") {
                    const item = items[selected];
                    if (item) command(item);
                    return true;
                }

                return false;
            },
        }));

        if (!items.length) {
            return (
                <div className="pointer-events-auto w-56 rounded-md border border-white/10 bg-charcoal p-2 text-[13px] text-mist/45 shadow-lg">
                    No matches
                </div>
            );
        }

        return (
            <div
                onMouseDown={(event) => event.preventDefault()}
                className="pointer-events-auto flex w-56 flex-col gap-px rounded-md border border-white/10 bg-charcoal p-1 shadow-lg"
            >
                {items.map((item, index) => {
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.title}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => command(item)}
                            onMouseEnter={() => setSelected(index)}
                            className={cn(
                                "flex cursor-pointer items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-[13px] text-mist/85 transition-colors",
                                index === selected ? "bg-white/10" : "hover:bg-white/5",
                            )}
                        >
                            <Icon className="size-4 shrink-0 text-mist/45" />
                            {item.title}
                        </button>
                    );
                })}
            </div>
        );
    },
);

export default SlashCommandList;
