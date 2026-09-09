"use client";
import { DropdownCaretIcon } from "@trydarwin/ui/icons";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const DISCLOSURE_SPRING = {
    type: "spring",
    stiffness: 300,
    damping: 34,
    mass: 0.9,
} as const;

export default function Disclosure({
    label,
    leading,
    trailing,
    open,
    onOpenChange,
    className,
    children,
}: {
    label: ReactNode;
    leading?: ReactNode;
    trailing?: ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section className={cn("surface-card overflow-hidden rounded-[8px]", className)}>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => onOpenChange(!open)}
                    aria-expanded={open}
                    className="group flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left"
                >
                    {leading}
                    <span className="text-[12px] font-medium text-overlay/50 transition-colors group-hover:text-overlay/70">
                        {label}
                    </span>
                    <DropdownCaretIcon
                        className={cn(
                            "ml-auto size-4 shrink-0 text-neutral-500 transition-transform",
                            open && "-rotate-180",
                        )}
                        aria-hidden
                    />
                </button>
                {trailing}
            </div>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={DISCLOSURE_SPRING}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-[var(--surface-card-border)]">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
