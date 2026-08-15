"use client";

import { FlutedGlass } from "@paper-design/shaders-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ShowcaseFrameProps = {
    image: string;
    /** Per-panel overrides for the fluted-glass treatment. */
    glass?: Partial<ComponentProps<typeof FlutedGlass>>;
    /** Overrides the frame's outer sizing/rounding (defaults to the showcase stage). */
    className?: string;
    /** Overrides the centred content width (defaults to max-w-110). */
    contentClassName?: string;
    children: React.ReactNode;
};

/**
 * The fixed-size stage every showcase card stands on: a fluted-glass rendering
 * of the panel's image with the mock floating in the centre.
 */
export default function ShowcaseFrame({
    image,
    glass,
    className,
    contentClassName,
    children,
}: ShowcaseFrameProps) {
    return (
        <div className={cn("relative h-110 w-full overflow-hidden rounded-lg md:h-140", className)}>
            <FlutedGlass
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                image={image}
                colorBack="#00000000"
                colorShadow="#000000"
                colorHighlight="#ffffff"
                size={0.5}
                shadows={0.25}
                highlights={0.1}
                shape="lines"
                angle={0}
                distortionShape="prism"
                distortion={0.2}
                shift={0}
                stretch={0}
                blur={0}
                edges={0}
                margin={0}
                grainMixer={0}
                grainOverlay={0}
                fit="cover"
                {...glass}
            />
            <div className="absolute inset-0 bg-ink/25" />
            <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className={cn("w-full max-w-110", contentClassName)}>{children}</div>
            </div>
        </div>
    );
}
