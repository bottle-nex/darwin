"use client";

import { CtaArrowIcon } from "@trymatcha/ui/icons";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { MatchaLogo } from "@/components/logo/MatchaLogo";
import { Button } from "@/components/ui/button";

import { stepItemVariants, stepVariants } from "./choreography";
import { TOUR_STEPS, type TourStep } from "./steps";

export const UNDERLINE_FIELD =
    "h-11 rounded-none border-0 border-b border-white/12 bg-transparent px-0 text-lg text-neutral-100 shadow-none placeholder:text-neutral-600 hover:bg-transparent focus-visible:border-primary focus-visible:ring-0 dark:bg-transparent";

export function StepItem({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <motion.div variants={stepItemVariants} className={className}>
            {children}
        </motion.div>
    );
}

export default function StepFrame({
    step,
    direction,
    transitioning,
    onNext,
    onBack,
    children,
}: {
    step: TourStep;
    direction: number;
    transitioning: boolean;
    onNext: () => void;
    onBack: () => void;
    children: ReactNode;
}) {
    return (
        <motion.div
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="pointer-events-auto absolute top-[18vh] left-[8vw] w-full max-w-xl pr-6"
        >
            <StepItem className="text-[13px] text-neutral-500">
                Step {step.id} of {TOUR_STEPS.length} · {step.name}
            </StepItem>
            <StepItem className="mt-3 text-4xl font-medium tracking-tight text-neutral-100 md:text-5xl">
                {step.title}
            </StepItem>
            <StepItem className="mt-4 max-w-md text-[15px] leading-relaxed text-neutral-400">
                {step.blurb}
            </StepItem>
            <div className="mt-9 space-y-7">{children}</div>
            <StepItem className="mt-10 flex items-center gap-5">
                <Button onClick={onNext} disabled={transitioning}>
                    {step.id === TOUR_STEPS.length ? (
                        <>
                            <span>Finish setup</span>
                            <MatchaLogo className="size-4.5" />
                        </>
                    ) : (
                        <>
                            <span>Continue</span>
                            <CtaArrowIcon />
                        </>
                    )}
                </Button>
                {step.id > 1 && (
                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={onBack}
                        disabled={transitioning}
                        className="ml-auto cursor-pointer text-[13px] text-neutral-500 transition-colors hover:text-neutral-300 disabled:opacity-50"
                    >
                        Back
                    </Button>
                )}
            </StepItem>
        </motion.div>
    );
}
