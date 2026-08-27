"use client";
import { BeforeAfterFrameIcon, HelpIcon } from "@trymatcha/ui/icons";
import type { ReactNode } from "react";

import { MICRO_LABEL } from "@/components/playground/Core/components/paneBar";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { cn } from "@/lib/utils";

const APPROXIMATION_HINT =
    "A rendered approximation, not the exact visual change. The component runs on its own in a sandbox, so fonts, data and surrounding layout can differ from the real app.";

export const FRAME_SHELL = "overflow-hidden rounded-lg border border-snow/10 bg-white/2";

export const FRAME_BORDER_X = 2;
export const FRAME_CHROME_X = FRAME_BORDER_X + 24;

export default function DiffFrame({
    label,
    mirrored,
    width,
    height,
    children,
}: {
    label: string;
    mirrored?: boolean;
    width: number;
    height: number;
    children: ReactNode;
}) {
    return (
        <section className={`${FRAME_SHELL} mx-auto w-fit px-3 pb-3`}>
            <header className="flex shrink-0 items-center gap-1.5 py-2">
                <BeforeAfterFrameIcon
                    className={cn("size-3.5 shrink-0 text-neutral-500", mirrored && "-scale-x-100")}
                    aria-hidden
                />
                <span className={MICRO_LABEL}>{label}</span>

                <TooltipComponent content={APPROXIMATION_HINT} className="max-w-56">
                    <span
                        tabIndex={0}
                        aria-label={APPROXIMATION_HINT}
                        className="ml-auto flex size-5 shrink-0 cursor-help items-center justify-center rounded-md text-neutral-600 transition-colors outline-none hover:bg-white/5 hover:text-neutral-300 focus-visible:text-neutral-300"
                    >
                        <HelpIcon className="size-3.5" />
                    </span>
                </TooltipComponent>
            </header>
            <div className="overflow-hidden rounded-md" style={{ width, height }}>
                {children}
            </div>
        </section>
    );
}
