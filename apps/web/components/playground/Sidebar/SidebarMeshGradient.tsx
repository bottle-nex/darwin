"use client";
import { MeshGradient } from "@paper-design/shaders-react";
import { useSyncExternalStore, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { meshPaletteFor, staticGradientFor } from "@/lib/sidebarTheme";
import { useSidebarThemeStore } from "@/store/playground/useSidebarThemeStore";

const DRIFT_SPEED = 0;
const SIDEBAR_BLUR_PX = 40;
const SCRIM_OPACITY = 0.45;
const TOP_SHADE_BACKGROUND =
    "linear-gradient(to bottom, rgba(10, 10, 10, 0.46) 0%, rgba(10, 10, 10, 0.22) 42%, transparent 72%)";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
    return useSyncExternalStore(
        subscribeToReducedMotion,
        () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
        () => false,
    );
}

export function MeshGradientSurface({
    palette,
    blurPx = SIDEBAR_BLUR_PX,
    className,
}: {
    palette: string[];
    blurPx?: number;
    className?: string;
}) {
    const prefersReducedMotion = usePrefersReducedMotion();

    const shaderStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        filter: `blur(${blurPx}px)`,
        transform: "scale(1.6)",
    };

    return (
        <div
            aria-hidden
            className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
        >
            <MeshGradient
                style={shaderStyle}
                colors={palette}
                fit="cover"
                distortion={0.35}
                swirl={0.05}
                grainMixer={0}
                grainOverlay={0}
                speed={prefersReducedMotion ? 0 : DRIFT_SPEED}
            />
            <div className="absolute inset-0 bg-ink" style={{ opacity: SCRIM_OPACITY }} />
            <div className="absolute inset-0" style={{ background: TOP_SHADE_BACKGROUND }} />
        </div>
    );
}

export default function SidebarMeshGradient() {
    const gradientKey = useSidebarThemeStore((s) => s.gradientKey);
    const staticGradient = gradientKey && staticGradientFor(gradientKey);

    if (staticGradient) {
        return (
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: staticGradient }}
            />
        );
    }

    const palette = gradientKey && meshPaletteFor(gradientKey);
    if (!palette) return null;

    return <MeshGradientSurface key={gradientKey} palette={palette} />;
}
