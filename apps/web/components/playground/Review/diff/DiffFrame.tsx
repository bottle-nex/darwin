"use client";
import { BeforeAfterFrameIcon } from "@trydarwin/ui/icons";
import type { ReactNode } from "react";

import { MICRO_LABEL } from "@/components/playground/Core/components/paneBar";
import HelpHint from "@/components/ui/HelpHint";
import { cn } from "@/lib/utils";

const APPROXIMATION_HINT =
    "A rendered approximation, not the exact visual change. The component runs on its own in a sandbox, so fonts, data and surrounding layout can differ from the real app.";

export const FRAME_SHELL = "surface-raised overflow-hidden rounded-lg";

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

                <HelpHint
                    content={APPROXIMATION_HINT}
                    label={APPROXIMATION_HINT}
                    side="top"
                    contentClassName="max-w-56"
                    className="ml-auto size-5 hover:bg-overlay/5"
                />
            </header>
            <div className="overflow-hidden rounded-md" style={{ width, height }}>
                {children}
            </div>
        </section>
    );
}
