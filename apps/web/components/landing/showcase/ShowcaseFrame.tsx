"use client";

import { FlutedGlass } from "@paper-design/shaders-react";
import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/utils";

const shaderStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
};

type ShowcaseFrameProps = {
    image: string;
    /** Per-panel overrides for the fluted-glass treatment. */
    glass?: Partial<ComponentProps<typeof FlutedGlass>>;
    /** Overrides the frame's outer sizing/rounding (defaults to the showcase stage). */
    className?: string;
    /** Overrides the centred content width (defaults to max-w-110). */
    contentClassName?: string;
    children?: React.ReactNode;
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
        <div
            className={cn(
                "relative w-full overflow-hidden rounded-lg border border-edge",
                className,
            )}
        >
            <FlutedGlass
                style={shaderStyle}
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
            <div className="absolute inset-0 bg-ink/40" />
            <div className="relative flex min-h-110 items-center justify-center p-4 sm:p-6 md:min-h-140">
                <div className={cn("w-full max-w-110", contentClassName)}>{children}</div>
            </div>
        </div>
    );
}
