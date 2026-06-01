"use client";

import { useRef } from "react";
import { useScroll } from "motion/react";
import { COLUMNS } from "./data";
import { KanbanColumn } from "./KanbanColumn";

export default function LandingKanbanBoard() {
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end end"],
    });

    return (
        <section ref={ref} className="relative h-[300vh] w-full">
            <div className="sticky top-0 flex h-screen items-center justify-center px-4">
                <div className="mx-auto flex h-[80vh] w-full max-w-7xl gap-4 sm:gap-5">
                    {COLUMNS.map((column, index) => (
                        <KanbanColumn
                            key={column.status}
                            progress={scrollYProgress}
                            index={index}
                            total={COLUMNS.length}
                            column={column}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
