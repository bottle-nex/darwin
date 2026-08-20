"use client";

import { useBackgroundLightingStore } from "@/store/playground/useBackgroundLightingStore";

const GLOW_RGB = "132, 114, 245";
const GLOW_PEAK_ALPHA = 0.145;
const GLOW_STOP_COUNT = 40;

const glowStops = Array.from({ length: GLOW_STOP_COUNT + 1 }, (_, index) => {
    const distance = index / GLOW_STOP_COUNT;
    const falloff = (0.5 + 0.5 * Math.cos(Math.PI * distance)) ** 1.3;
    const alpha = (GLOW_PEAK_ALPHA * falloff).toFixed(4);
    return `rgba(${GLOW_RGB}, ${alpha}) ${(distance * 100).toFixed(1)}%`;
}).join(", ");

export default function BackgroundLighting() {
    const angle = useBackgroundLightingStore((state) => state.angle);
    const angleInRadians = (angle * Math.PI) / 180;
    const lightX = 50 + Math.cos(angleInRadians) * 55;
    const lightY = 50 + Math.sin(angleInRadians) * 55;
    const background = `radial-gradient(ellipse 230% 210% at ${lightX}% ${lightY}%, ${glowStops})`;

    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-ink">
            <div className="absolute inset-0" style={{ background }} />
            <div className="grain absolute inset-0 opacity-[0.16]" />
        </div>
    );
}
