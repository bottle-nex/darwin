"use client";
import type { ReviewFile } from "@trymatcha/types";
import { GoFileCode } from "react-icons/go";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function splitPath(filename: string): { name: string; directory: string } {
    const cut = filename.lastIndexOf("/");
    return cut === -1
        ? { name: filename, directory: "" }
        : { name: filename.slice(cut + 1), directory: filename.slice(0, cut) };
}

export default function ReviewFileRow({
    file,
    selected,
    onSelect,
}: {
    file: ReviewFile;
    selected: boolean;
    onSelect: () => void;
}) {
    const { name, directory } = splitPath(file.filename);

    return (
        <Button
            variant="unstyled"
            onClick={onSelect}
            aria-current={selected}
            className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-left transition-colors bg-white/3 ring-[0.5px] ring-snow/5",
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
                {name}
            </span>
            <span className="min-w-0 flex-1 truncate font-headline text-[12.5px] text-neutral-600">
                {directory}
            </span>
            <span className="shrink-0 text-[12.5px] tabular-nums">
                {file.additions > 0 && <span className="text-green-500">+{file.additions}</span>}
                {file.deletions > 0 && <span className="text-rose-500"> −{file.deletions}</span>}
            </span>
        </Button>
    );
}
