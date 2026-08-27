"use client";
import type { Capsule } from "@trymatcha/types";
import { GoFileCode } from "react-icons/go";

import { splitPath } from "@/components/playground/Review/changes/ReviewFileRow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CapsuleList({
    capsules,
    selectedId,
    onSelect,
}: {
    capsules: Capsule[];
    selectedId: string;
    onSelect: (id: string) => void;
}) {
    return (
        <>
            <p className="px-3 font-headline text-[12.5px] text-neutral-500 tabular-nums">
                {capsules.length} {capsules.length === 1 ? "component" : "components"} changed
            </p>
            {capsules.map((capsule) => (
                <CapsuleRow
                    key={capsule.id}
                    capsule={capsule}
                    selected={capsule.id === selectedId}
                    onSelect={() => onSelect(capsule.id)}
                />
            ))}
        </>
    );
}

function CapsuleRow({
    capsule,
    selected,
    onSelect,
}: {
    capsule: Capsule;
    selected: boolean;
    onSelect: () => void;
}) {
    const { directory } = splitPath(capsule.componentPath);

    return (
        <Button
            variant="unstyled"
            onClick={onSelect}
            aria-current={selected}
            className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-md bg-white/3 px-3 py-1.5 text-left ring-[0.5px] ring-snow/5 transition-colors",
                selected ? "bg-white/8" : "hover:bg-white/4",
            )}
        >
            <GoFileCode className="size-3.5 shrink-0 text-neutral-500" />
            <span
                className={cn(
                    "min-w-0 truncate font-headline text-[14px]",
                    selected ? "text-neutral-100" : "text-neutral-400",
                )}
            >
                {capsule.title}
            </span>
            <span className="min-w-0 flex-1 truncate font-headline text-[12.5px] text-neutral-600">
                {directory}
            </span>
        </Button>
    );
}
