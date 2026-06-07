"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionProps = {
    /** Heading text. */
    title: string;
    /** Optional right-aligned action (e.g. "+" button). */
    action?: React.ReactNode;
    /** Initial open state. */
    defaultOpen?: boolean;
    /**
     * "header" = small uppercase label (Projects, Teams).
     * "inline" = lowercase title (Favorites style).
     */
    variant?: "header" | "inline";
    children: React.ReactNode;
};

/**
 * Collapsible group used by every sidebar section. Variants tweak the visual
 * weight of the header without changing the behaviour.
 */
export default function PlaygroundSidebarSection({
    title,
    action,
    defaultOpen = true,
    variant = "header",
    children,
}: SectionProps) {
    const [open, setOpen] = useState(defaultOpen);
    const Chevron = open ? ChevronDown : ChevronRight;

    return (
        <section className="flex flex-col">
            <div className="flex items-center justify-between gap-1 pr-1">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className={cn(
                        "group flex flex-1 cursor-pointer items-center justify-between rounded-md py-1.5 text-left hover:bg-white/5",
                        variant === "header"
                            ? "px-2 text-[11px] font-medium tracking-wide text-neutral-500 uppercase"
                            : "px-2 text-[12px] font-medium text-neutral-400",
                    )}
                >
                    <span>{title}</span>
                    <Chevron
                        className="size-3 text-neutral-500 opacity-0 transition-opacity duration-100 group-hover:opacity-100"
                        aria-hidden
                    />
                </button>
                {action && <span className="flex items-center">{action}</span>}
            </div>

            {open && <div className="flex flex-col gap-0.5">{children}</div>}
        </section>
    );
}
