"use client";

import { useRef } from "react";
import { useScroll, useMotionValue, useMotionValueEvent } from "motion/react";
import { COLUMNS } from "./data";
import { KanbanColumn } from "./KanbanColumn";

export default function LandingKanbanBoard() {
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end end"],
    });

    const revealProgress = useMotionValue(0);
    useMotionValueEvent(scrollYProgress, "change", (v) => {
        if (v > revealProgress.get()) revealProgress.set(v);
    });

    const prefilledCount = COLUMNS[0].issues.length;
    const totalCards = COLUMNS.reduce((n, c) => n + c.issues.length, 0);
    const animatedTotal = totalCards - prefilledCount;
    const cardOffsets = COLUMNS.reduce<number[]>((acc, _column, i) => {
        acc.push(i === 0 ? 0 : acc[i - 1] + COLUMNS[i - 1].issues.length);
        return acc;
    }, []);

    return (
        <section ref={ref} className="relative h-[360vh] w-full">
            <div className="sticky top-0 flex h-screen items-center justify-center px-4">
                <div className="mx-auto flex h-[80vh] w-full max-w-7xl gap-4 sm:gap-5">
                    {COLUMNS.map((column, index) => (
                        <KanbanColumn
                            key={column.status}
                            progress={revealProgress}
                            cardOffset={cardOffsets[index]}
                            prefilledCount={prefilledCount}
                            animatedTotal={animatedTotal}
                            column={column}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
