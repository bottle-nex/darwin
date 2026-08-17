"use client";

import { Button } from "@/components/ui/button";
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
                if (event.key === "ArrowDown") {
                    setSelected((prev) => (prev + 1) % items.length);
                    return true;
                }
                if (event.key === "ArrowUp") {
                    setSelected((prev) => (prev - 1 + items.length) % items.length);
                    return true;
                }
                if (event.key === "Enter") {
                    if (items[selected]) command(items[selected]);
                    return true;
                }
                return false;
            },
        }));

        if (!items.length) {
            return (
                <div className="w-56 rounded-md border border-white/10 bg-charcoal p-2 text-[13px] text-neutral-500 shadow-lg pointer-events-auto">
                    No matches
                </div>
            );
        }

        return (
            <div
                onMouseDown={(event) => event.preventDefault()}
                className="flex w-56 flex-col gap-px rounded-md border border-white/10 bg-neutral-900 p-1 shadow-lg pointer-events-auto"
            >
                {items.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <Button
                            variant="unstyled"
                            key={item.title}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => command(item)}
                            onMouseEnter={() => setSelected(index)}
                            className={cn(
                                "flex items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-[13px] text-neutral-200 transition-colors cursor-pointer",
                                index === selected ? "bg-white/10" : "hover:bg-white/5",
                            )}
                        >
                            <Icon className="size-4 shrink-0 text-neutral-400" />
                            {item.title}
                        </Button>
                    );
                })}
            </div>
        );
    },
);

export default SlashCommandList;
