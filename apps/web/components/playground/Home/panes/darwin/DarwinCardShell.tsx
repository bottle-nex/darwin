"use client";
import { DropdownCaretIcon } from "@trydarwin/ui/icons";
import { motion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EXPAND_TRANSITION = { duration: 0.26, ease: [0.25, 1, 0.35, 1] } as const;

/**
 * The surface every Darwin card sits on.
 *
 * One shell rather than each card inventing its own border, so a list of issues and a project
 * summary read as the same kind of thing.
 */
export function DarwinCard({
    title,
    trailing,
    children,
    className,
}: {
    title?: string;
    trailing?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={cn("surface-card overflow-hidden rounded-lg", className)}>
            {(title || trailing) && (
                <header className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-1.5">
                    {title && (
                        <h3 className="text-[11px] font-medium tracking-[0.04em] text-neutral-500 uppercase">
                            {title}
                        </h3>
                    )}
                    {trailing}
                </header>
            )}
            {children}
        </section>
    );
}

/**
 * Shows the first `preview` children and folds the rest away.
 *
 * Copies the chat message's expand: an animated height with a mask fade, rather than a hard cut
 * that makes the boundary look like the end of the list.
 */
export function DarwinReveal({
    children,
    preview,
    label,
}: {
    children: React.ReactNode[];
    preview: number;
    label: (hidden: number) => string;
}) {
    const [expanded, setExpanded] = useState(false);
    const hidden = children.length - preview;

    if (hidden <= 0) return <>{children}</>;

    return (
        <>
            {children.slice(0, preview)}
            <motion.div
                initial={false}
                animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
                transition={EXPAND_TRANSITION}
                className="overflow-hidden"
            >
                {children.slice(preview)}
            </motion.div>
            <Button
                variant="unstyled"
                type="button"
                onClick={() => setExpanded((open) => !open)}
                className="flex w-full cursor-pointer items-center gap-1 px-2 py-1.5 text-left text-[12px] text-neutral-500 transition-colors hover:text-neutral-300"
            >
                <DropdownCaretIcon
                    className={cn("size-3 transition-transform", expanded && "rotate-180")}
                    aria-hidden
                />
                {expanded ? "Show less" : label(hidden)}
            </Button>
        </>
    );
}
