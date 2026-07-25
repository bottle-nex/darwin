"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { motion, useMotionValue, animate } from "motion/react";

import { cn } from "@/lib/utils";

const TRACK_WIDTH = 32;
const TRACK_HEIGHT = 18;
const THUMB_SIZE = 14;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - 4;

const spring = { type: "spring" as const, duration: 0.35, bounce: 0.3 };
const springFast = { type: "spring" as const, duration: 0.15, bounce: 0 };
const springSnap = { type: "spring" as const, duration: 0.4, bounce: 0.5 };

function Switch({
    checked,
    onCheckedChange,
    className,
    ref,
    ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
    const isChecked = checked ?? false;

    const thumbX = useMotionValue(isChecked ? THUMB_TRAVEL : 0);
    const thumbScaleX = useMotionValue(1);
    const thumbScaleY = useMotionValue(1);
    const prevChecked = React.useRef(isChecked);

    React.useEffect(() => {
        if (prevChecked.current === isChecked) return;
        prevChecked.current = isChecked;
        animate(thumbX, isChecked ? THUMB_TRAVEL : 0, spring);
    }, [isChecked, thumbX]);

    function handlePointerDown() {
        animate(thumbScaleX, 0.82, springFast);
        animate(thumbScaleY, 1.1, springFast);
    }

    function handlePointerUp() {
        animate(thumbScaleX, 1, springSnap);
        animate(thumbScaleY, 1, springSnap);
    }

    function handleCheckedChange(next: boolean) {
        animate(thumbScaleX, 1.15, springFast).then(() => animate(thumbScaleX, 1, springSnap));
        animate(thumbScaleY, 0.88, springFast).then(() => animate(thumbScaleY, 1, springSnap));
        animate(thumbX, next ? THUMB_TRAVEL : 0, spring);
        onCheckedChange?.(next);
    }

    return (
        <SwitchPrimitive.Root
            ref={ref}
            data-slot="switch"
            checked={checked}
            onCheckedChange={handleCheckedChange}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={cn(
                "relative inline-flex shrink-0 cursor-pointer items-center rounded-full bg-white/15 outline-none transition-colors data-[state=checked]:bg-primary focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
                className,
            )}
            style={{ width: TRACK_WIDTH, height: TRACK_HEIGHT }}
            {...props}
        >
            <SwitchPrimitive.Thumb asChild>
                <motion.span
                    className="pointer-events-none z-10 block rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
                    style={{
                        width: THUMB_SIZE,
                        height: THUMB_SIZE,
                        x: thumbX,
                        scaleX: thumbScaleX,
                        scaleY: thumbScaleY,
                        marginLeft: 2,
                    }}
                />
            </SwitchPrimitive.Thumb>
        </SwitchPrimitive.Root>
    );
}

export { Switch };
