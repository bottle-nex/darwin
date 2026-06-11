"use client";
import { motion, useReducedMotion } from "motion/react";
import { CircleDashed, GitPullRequest, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { azeretMono } from "@/components/ui/button";

type FloatingCardProps = {
    children: React.ReactNode;
    className?: string;
    rotate: number;
    delay: number;
};

function FloatingCard({ children, className, rotate, delay }: FloatingCardProps) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 24, rotate }}
            animate={{
                opacity: 0.65,
                y: reduceMotion ? 0 : [0, -8, 0],
                rotate,
            }}
            transition={{
                opacity: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay },
                y: reduceMotion
                    ? undefined
                    : {
                          duration: 7,
                          ease: "easeInOut",
                          repeat: Infinity,
                          delay: delay + 0.8,
                      },
            }}
            className={cn("absolute w-60", className)}
        >
            {children}
        </motion.div>
    );
}

/**
 * Decorative, faded issue cards floating at the hero's edges — one per stage
 * of the agent loop (queued → writing patch → PR up). Purely visual.
 */
export default function HeroIssueCards() {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden select-none xl:block"
        >
            <div className="relative mx-auto h-full w-full max-w-7xl">
                {/* Light — queued on the board */}
                <FloatingCard rotate={-6} delay={0.5} className="top-[24%] -left-4 2xl:left-2">
                    <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.25)]">
                        <div className="flex items-center justify-between gap-2">
                            <span
                                className={cn("text-[11px] text-neutral-400", azeretMono.className)}
                            >
                                #142
                            </span>
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-500">
                                feature
                            </span>
                        </div>
                        <p className="mt-2 text-[13px] font-medium leading-snug text-neutral-800">
                            Add dark mode toggle to workspace settings
                        </p>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400">
                            <span className="flex items-center gap-1.5">
                                <CircleDashed className="size-3" />
                                To Do
                            </span>
                            <span>Queued for agent</span>
                        </div>
                    </div>
                </FloatingCard>

                {/* Dark — agent mid-flight */}
                <FloatingCard rotate={5} delay={0.65} className="top-[34%] -right-4 2xl:right-2">
                    <div className="rounded-xl bg-charcoal p-3 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.55)] ring-1 ring-white/10">
                        <div className="flex items-center justify-between gap-2">
                            <span
                                className={cn("text-[11px] text-neutral-500", azeretMono.className)}
                            >
                                #150
                            </span>
                            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-medium text-rose-300">
                                bug
                            </span>
                        </div>
                        <p className="mt-2 text-[13px] font-medium leading-snug text-neutral-100">
                            Fix memory leak in the board editor
                        </p>
                        <div className="mt-3 flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-1.5 text-amber-300">
                                <span className="relative flex size-2">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-60" />
                                    <span className="relative inline-flex size-2 rounded-full bg-amber-400" />
                                </span>
                                Writing patch
                            </span>
                            <span className={cn("text-neutral-500", azeretMono.className)}>
                                Opus 4.8
                            </span>
                        </div>
                    </div>
                </FloatingCard>

                {/* Light — PR opened, ready for review */}
                <FloatingCard rotate={4} delay={0.8} className="bottom-[14%] left-6 2xl:left-14">
                    <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.25)]">
                        <div className="flex items-center justify-between gap-2">
                            <span
                                className={cn("text-[11px] text-neutral-400", azeretMono.className)}
                            >
                                #145
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                                <MessageSquare className="size-3" />
                                12
                            </span>
                        </div>
                        <p className="mt-2 text-[13px] font-medium leading-snug text-neutral-800">
                            Implement realtime collaboration cursors
                        </p>
                        <div className="mt-3 flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-1.5 text-violet-500">
                                <GitPullRequest className="size-3" />
                                PR #234
                            </span>
                            <span className={cn(azeretMono.className)}>
                                <span className="text-emerald-500">+128</span>{" "}
                                <span className="text-rose-400">−16</span>
                            </span>
                        </div>
                    </div>
                </FloatingCard>
            </div>
        </div>
    );
}
