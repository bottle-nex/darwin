"use client";

import { CloseIcon } from "@trydarwin/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import IconWrapper from "@/components/ui/IconWrapper";
import { cn } from "@/lib/utils";

/** An action inside the bar. Styled here so every bar's buttons match. */
export function SelectionBarButton({
    children,
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <Button
            variant="unstyled"
            type="button"
            className={cn(
                "flex cursor-pointer items-center gap-1.25 rounded-full border border-snow/5 bg-snow/4 py-1.25 pr-3.5 pl-3 text-[11px] text-snow shadow-sm shadow-black/7 transition-colors hover:bg-snow/6",
                className,
            )}
            {...props}
        >
            {children}
        </Button>
    );
}

/**
 * The pill that slides up over a pane while rows or cards are selected: what is
 * selected, the actions for it, and a way out. Position it inside a `relative`
 * ancestor — it floats over that pane, not the viewport.
 */
export default function SelectionBar({
    count,
    hint,
    onClear,
    children,
}: {
    count: number;
    /** Small muted note after the count, e.g. a keyboard tip. */
    hint?: string;
    onClear: () => void;
    children?: ReactNode;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <AnimatePresence>
            {count > 0 && (
                <motion.div
                    key="selection-bar"
                    initial={reduceMotion ? false : { y: "calc(100% + 3rem)" }}
                    animate={{ y: 0 }}
                    exit={reduceMotion ? { y: 0 } : { y: "calc(100% + 3rem)" }}
                    transition={{
                        duration: reduceMotion ? 0 : 0.28,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    className="pointer-events-none absolute inset-x-0 bottom-6 z-40 flex justify-center"
                >
                    <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-cement py-1.75 pr-2 pl-5 shadow-lg shadow-black/30">
                        <span className="text-[13px] text-snow/90">{count} selected</span>
                        {hint && (
                            <span className="hidden text-[12px] text-neutral-500 sm:inline">
                                {hint}
                            </span>
                        )}
                        {children && (
                            <div className="ml-2 flex items-center gap-1.5">{children}</div>
                        )}
                        <Button
                            variant="unstyled"
                            type="button"
                            aria-label="Clear selection"
                            onClick={onClear}
                            className="group cursor-pointer rounded-full"
                        >
                            <IconWrapper icon={CloseIcon} variant="ghost" />
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
