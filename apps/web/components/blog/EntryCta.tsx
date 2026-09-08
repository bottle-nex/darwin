"use client";

import { CtaArrowIcon } from "@trydarwin/ui/icons";
import { useInView, useReducedMotion } from "motion/react";
import Link from "next/link";
import { type CSSProperties, useRef } from "react";

import { AppLogo } from "@/components/logo/AppLogo";
import { cn } from "@/lib/utils";

const LIGHT_DELAY_MS = 200;

export default function EntryCta() {
    const cardRef = useRef<HTMLDivElement>(null);
    const reduceMotion = useReducedMotion();
    const inView = useInView(cardRef, { once: true, amount: 0.4 });
    const lit = Boolean(reduceMotion) || inView;

    return (
        <div
            ref={cardRef}
            style={
                {
                    "--lit-intensity": 0.45,
                    "--lit-delay": `${LIGHT_DELAY_MS}ms`,
                } as CSSProperties
            }
            className={cn(
                "lit-edge lit-sweep relative overflow-hidden rounded-[10px] bg-charcoal/40 p-6",
                lit && "is-lit",
            )}
        >
            <span className="flex size-11 items-center justify-center rounded-[10px] bg-graphite">
                <AppLogo className="h-4 w-auto text-snow" />
            </span>

            <h2 className="mt-5 text-[15px] font-medium text-snow">
                Get started with darwin for free
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-mist/45">
                Drop an issue on the board and the agent takes it from there — clones the repo,
                makes the change, runs your tests, and opens a pull request for review.
            </p>

            <div className="mt-6 flex flex-col gap-y-2">
                <Link
                    href="/login"
                    className="flex h-10 items-center justify-center gap-x-1 rounded-lg bg-snow text-[14px] font-medium text-ink transition-colors"
                >
                    Get started
                    <CtaArrowIcon className="size-4" />
                </Link>
                <Link
                    href="/why"
                    className="flex h-10 items-center justify-center gap-x-1 rounded-lg bg-white/6 text-[14px] font-medium text-snow transition-colors hover:bg-white/10"
                >
                    See how it works
                    <CtaArrowIcon className="size-4" />
                </Link>
            </div>
        </div>
    );
}
