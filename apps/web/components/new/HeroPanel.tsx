"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { sourceSerif4 } from "@/lib/fonts";
import ParticleField from "./ParticleField";
import { Button } from "../ui/button";

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
                className="expanding-panel isolate overflow-hidden bg-[#141413] flex flex-col items-center justify-center gap-6 text-center"
                style={
                    {
                        "--squeeze": prefersReducedMotion ? 1 : smoothSqueeze,
                    } as CSSProperties
                }
            >
                <ParticleField className="absolute inset-0 -z-10 opacity-25" />

                <h2
                    className={cn(
                        "max-w-200 font-medium text-white text-[3.5rem] leading-[1.1]",
                        sourceSerif4.className,
                    )}
                >
                    Every issue on your board is already being worked on.
                </h2>

                <p className="max-w-2xl text-[#f0eff8] text-[1.2rem]">
                    Drop the work on the board and walk away. Issues get claimed, implemented, and
                    verified, you come back to PRs.
                </p>

                <Button variant={'tertiary'} className="bg-[#f0eff8] text-[#141413] px-4 py-1.75 font-medium rounded-md cursor-pointer text-[14px] shadow-xs shadow-black/5">
                    Get Started
                </Button>
            </motion.div>
        </div>
    );
}
