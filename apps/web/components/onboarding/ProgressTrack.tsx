"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { FlagSprite } from "./PixelSprites";
import { TOUR_STEPS } from "./steps";

const flagLeft = (index: number) => 34 + index * 14;

export default function ProgressTrack({ activeStep }: { activeStep: number }) {
    const markerIndex = Math.min(activeStep, TOUR_STEPS.length) - 1;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.4, duration: 0.5 } }}
            className="pointer-events-none absolute inset-x-0 bottom-[18%] h-0"
        >
            {TOUR_STEPS.map((step, i) => {
                const reached = activeStep > i;
                return (
                    <div
                        key={step.id}
                        className="absolute bottom-0 -translate-x-1/2"
                        style={{ left: `${flagLeft(i)}%` }}
                    >
                        <FlagSprite active={reached} className="h-7 w-auto" />
                        <span
                            className={cn(
                                "absolute top-full left-1/2 mt-2.5 -translate-x-1/2 text-[11px]",
                                reached ? "text-neutral-400" : "text-neutral-700",
                            )}
                        >
                            {step.label}
                        </span>
                    </div>
                );
            })}
            <motion.span
                className="absolute size-1.5 -translate-x-1/2 bg-primary"
                style={{ bottom: -3 }}
                animate={{ left: `${flagLeft(markerIndex)}%` }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
            />
        </motion.div>
    );
}
