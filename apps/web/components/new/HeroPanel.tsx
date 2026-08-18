"use client";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { sourceSerif4 } from "@/lib/fonts";
import ParticleField from "./ParticleField";
import { DottedArrowRight } from "@/lib/svgs/svgs";

const SCROLL_SPRING = { stiffness: 700, damping: 16, mass: 0.15 };

export default function HeroPanel() {
    const slotRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const prefersReducedMotion = useReducedMotion();

    const [growthRange, setGrowthRange] = useState({ start: 0, end: 1 });

    useEffect(() => {
        const slot = slotRef.current;
        if (!slot) return;

        const measure = () => {
            const rect = slot.getBoundingClientRect();
            const slotTop = rect.top + window.scrollY;
            const slotCentre = slotTop + rect.height / 2;

            const start = Math.max(0, slotTop - window.innerHeight);
            const end = Math.max(start + 1, slotCentre - window.innerHeight / 2);
            setGrowthRange({ start, end });
        };

        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(document.body);
        window.addEventListener("resize", measure);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, []);

    const squeeze = useTransform(scrollY, [growthRange.start, growthRange.end], [1, 0]);
    const smoothSqueeze = useSpring(squeeze, SCROLL_SPRING);

    return (
        <div ref={slotRef} className="relative w-full h-[90vh] mt-15">
            <motion.div
                className="expanding-panel isolate overflow-hidden bg-black/50 flex flex-col items-center justify-center gap-6 text-center border border-graphite"
                style={
                    {
                        "--squeeze": prefersReducedMotion ? 1 : smoothSqueeze,
                    } as CSSProperties
                }
            >
                <ParticleField className="absolute inset-0 -z-10 opacity-25" />

                <h2
                    className={cn(
                        "max-w-200 font-medium text-snow text-[3.5rem] leading-[1.1] tracking-tight",
                        sourceSerif4.className,
                    )}
                >
                    Every issue on your board is already being worked on.
                </h2>

                <p className="max-w-2xl text-mist/70 text-[1.2rem]">
                    Drop the work on the board and walk away. Issues get claimed, implemented, and
                    verified, you come back to PRs.
                </p>
                <button className="flex items-center gap-1.75 bg-snow text-ink pr-3.5 pl-1 py-1 font-medium rounded-sm cursor-pointer text-[13px] shadow-xs shadow-black/5">
                    <div className="h-7 w-7 bg-primary rounded-[3px] flex justify-center items-center">
                        <DottedArrowRight size={20} />
                    </div>
                    Get Started
                </button>
            </motion.div>
        </div>
    );
}
