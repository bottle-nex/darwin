"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export function appear(delay: number) {
    return {
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { delay, duration: 0.5, ease: EASE_OUT } },
    };
}

/** The counterpart to appear(): fades an element out as its replacement arrives. */
export function vanish(delay: number) {
    return {
        hidden: { opacity: 1 },
        visible: { opacity: 0, transition: { delay, duration: 0.3 } },
    };
}

/** Owns the whileInView trigger; every variant inside a mock cascades from here. */
export function MockScene({ children }: { children: React.ReactNode }) {
    const reduceMotion = useReducedMotion();
    return (
        <motion.div
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
        >
            {children}
        </motion.div>
    );
}

/**
 * The uniform stage for the three showcase mocks: identical dimensions on md+
 * (equal width via the frame, fixed height here) and identical header
 * typography, with each card supplying its own content below.
 */
export function PanelCard({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex w-full flex-col overflow-hidden rounded-lg border border-white/8 bg-ink/95 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-transform duration-500 hover:-translate-y-1 md:h-110 md:p-7">
            <motion.h3
                variants={appear(0.1)}
                className="text-lg font-semibold tracking-tight text-snow md:text-xl"
            >
                {title}
            </motion.h3>
            <motion.p
                variants={appear(0.2)}
                className="mt-2 max-w-[30ch] text-sm leading-snug text-neutral-500 md:text-[15px]"
            >
                {description}
            </motion.p>
            <div className="mt-6 flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
    );
}

/** App-window chrome: traffic lights, mono breadcrumb, a meta slot on the right. */
export function MockWindow({
    title,
    meta,
    children,
}: {
    title: string;
    meta?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-charcoal/90 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-transform duration-500 hover:-translate-y-1">
            <div className="flex items-center gap-2 border-b border-white/5 px-3.5 py-2.5">
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((dot) => (
                        <span key={dot} className="size-2 rounded-full bg-white/10" />
                    ))}
                </div>
                <span className="ml-2 font-mono text-[10px] text-neutral-500">{title}</span>
                <div className="ml-auto flex items-center">{meta}</div>
            </div>
            <div className="p-3.5">{children}</div>
        </div>
    );
}

/** Shared palettes for the task-card mocks' tag and priority pills. */
export const TAG_STYLES = {
    research: "bg-emerald-400/10 text-emerald-300",
    meeting: "bg-violet-400/10 text-violet-300",
};

export const PRIORITY_STYLES = {
    medium: "border-orange-300/20 bg-orange-400/10 text-orange-300",
    high: "border-red-300/20 bg-red-400/10 text-red-300",
    low: "border-sky-300/20 bg-sky-400/10 text-sky-300",
};

export function TagPill({ label, className }: { label: string; className: string }) {
    return (
        <span
            className={cn(
                "rounded-[5px] px-1.5 py-0.75 text-[10px] leading-none font-medium",
                className,
            )}
        >
            {label}
        </span>
    );
}

export function PriorityPill({ label, className }: { label: string; className: string }) {
    return (
        <span
            className={cn(
                "flex w-fit items-center gap-1 rounded-[5px] border px-1.5 py-0.75 text-[10px] leading-none font-medium",
                className,
            )}
        >
            <span className="size-1 rounded-full bg-current" />
            {label}
        </span>
    );
}

export function Avatar({ initials, className }: { initials: string; className?: string }) {
    return (
        <span
            className={cn(
                "flex size-4.5 items-center justify-center rounded-full border border-white/15 bg-graphite text-[7px] font-medium text-neutral-300",
                className,
            )}
        >
            {initials}
        </span>
    );
}
