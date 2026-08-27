"use client";
import { CloseIcon, SearchIcon } from "@trymatcha/ui/icons";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ExpandableSearchBarProps = {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
    placeholder?: string;
    className?: string;
};

export default function ExpandableSearchBar({
    value,
    onChange,
    onClose,
    placeholder = "Search...",
    className,
}: ExpandableSearchBarProps) {
    return (
        <motion.div
            initial={{ clipPath: "inset(0 0 0 88%)", opacity: 0 }}
            animate={{ clipPath: "inset(0 0 0 0%)", opacity: 1 }}
            exit={{ clipPath: "inset(0 0 0 88%)", opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.25, 1, 0.35, 1] }}
            className={cn("relative w-full", className)}
        >
            <SearchIcon
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400"
                aria-hidden
            />
            <Input
                autoFocus
                value={value}
                variant={"ghost"}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key !== "Escape") return;
                    event.preventDefault();
                    event.stopPropagation();
                    onClose();
                }}
                placeholder={placeholder}
                className="h-8 rounded-md bg-cement pr-9 pl-8 text-[12.5px] hover:bg-cement"
            />
            <Button
                variant="unstyled"
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="absolute top-1/2 right-2 flex size-4 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-graphite text-neutral-400 transition-colors hover:text-neutral-100"
            >
                <CloseIcon className="size-2.5" aria-hidden />
            </Button>
        </motion.div>
    );
}
