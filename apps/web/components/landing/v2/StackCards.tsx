"use client";
import { MotionConfig, motion } from "framer-motion";
import HeroBuddy from "./HeroBuddy";

interface StackCardsProps {
    id: number;
    className: string;
}

export default function StackCards() {
    const base = "absolute rounded-xl bottom-32 left-1/2 w-140 p-9 border border-white/[0.07]";
    const cards: StackCardsProps[] = [
        {
            id: 1,
            className: `${base} -translate-x-[calc(50%+17.5rem)] h-160 bg-[linear-gradient(150deg,#121215_0%,#0f0f10_60%,#0f0f10_100%)]`,
        },
        {
            id: 2,
            className: `${base} -translate-x-1/2 h-165 bg-[linear-gradient(150deg,#15151a_0%,#101012_55%,#0f0f10_100%)]`,
        },
        {
            id: 3,
            className: `${base} -translate-x-[calc(50%-17.5rem)] h-170 overflow-hidden bg-[linear-gradient(150deg,#1a1a21_0%,#121216_50%,#0f0f10_100%)]`,
        },
    ];
    return (
        <main className="w-screen">
            <div className="max-w-7xl mx-auto flex w-full flex-col">
                <section className="grid gap-8 px-6 pt-32 md:grid-cols-2 md:items-end md:gap-16">
                    <h2 className="text-4xl font-extralight leading-[1.05] text-neutral-100 sm:text-5xl md:text-6xl">
                        Every agent works
                        <br />
                        <span className="text-neutral-500">in its own sandbox.</span>
                    </h2>
                    <p className="max-w-md leading-relaxed text-neutral-400 md:justify-self-end">
                        Each issue is claimed by an agent on an ephemeral runner that clones your
                        repo, builds it, and verifies the change against the real project, then
                        opens the pull request.
                    </p>
                </section>
                <section className="relative mt-24 h-202 w-full">
                    {cards.map((card) => (
                        <section key={card.id} className={card.className}>
                            {card.id === cards.length && (
                                <MotionConfig reducedMotion="user">
                                    <motion.div
                                        aria-hidden
                                        className="pointer-events-none absolute inset-y-0 -left-full flex w-full justify-end gap-9"
                                        style={{ skewX: -18, willChange: "transform" }}
                                        animate={{ x: ["-30%", "180%"] }}
                                        transition={{
                                            duration: 1.4,
                                            ease: "easeInOut",
                                            repeat: Infinity,
                                            repeatDelay: 2.5,
                                        }}
                                    >
                                        <div className="h-full w-10 bg-white/12" />
                                        <div className="h-full w-24 bg-white/10" />
                                    </motion.div>
                                </MotionConfig>
                            )}
                            <div className="h-full w-full">
                                <span className="relative flex items-center justify-start gap-2 text-neutral-500">
                                    <HeroBuddy move={false} className="size-6" />
                                    Agent {card.id}
                                </span>
                            </div>
                        </section>
                    ))}
                    <div className="pointer-events-none absolute bottom-32 left-0 h-48 w-full bg-linear-to-t from-cement to-transparent" />
                </section>
            </div>
        </main>
    );
}
