"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type AmbientDotFieldProps = {
    className?: string;
    /** Distance between grid points, in CSS pixels. */
    spacing?: number;
    /** Radius of a single sharp dot, in CSS pixels. */
    dotRadius?: number;
    /** Dot colour — any CSS colour string. */
    color?: string;
    /** Colour of the blurred depth layer. Defaults to `color`; a lighter shade reads as haze. */
    bloomColor?: string;
    /** Opacity of the brightest dot at the peak of its glow. */
    maxOpacity?: number;
    /** Fraction of the container width kept clear for the mockup sitting on top. */
    clearWidthRatio?: number;
    /** Hard cap, in CSS pixels, on the width of that cleared centre band. */
    clearWidthMax?: number;
    /** Where the mockup's top edge sits, as a fraction of height. Dots cap the space above it. */
    clearTop?: number;
    /**
     * Same edge, given in CSS pixels up from the bottom instead. Takes precedence over `clearTop`,
     * and is the one to use when the mockup has a fixed height — a fraction drifts off the edge as
     * the viewport grows.
     */
    clearTopOffset?: number;
    /** Brightness of that cap relative to the side fields: 0 removes it entirely. */
    capStrength?: number;
    /** How far the cap reaches above the mockup's top edge, as a fraction of height. */
    capReach?: number;
    /** Vertical position of the brightest row: 0 = top, 1 = bottom. */
    verticalCenter?: number;
    /** How far the field reaches above and below `verticalCenter`, as a fraction of height. */
    verticalSpread?: number;
    /** How fast the field dims travelling from the mockup edge out to the page edge. */
    horizontalFalloff?: number;
    /** Width of the ramp easing the field in off the mockup edge, as a fraction of the side span. */
    edgeRamp?: number;
    /** Draws the second, blurred, sparser dot layer that gives the field depth. */
    bloom?: boolean;
    /** Opacity of that blurred layer, as a fraction of `maxOpacity`. Light grounds need more. */
    bloomStrength?: number;
    /** Blur radius of that layer, in CSS pixels. */
    bloomBlur?: number;
    /** Seconds per glow cycle. */
    glowSeconds?: number;
    /** How far a dot fades at the bottom of its glow: 0 = static, 1 = all the way out. */
    glowDepth?: number;
};

type LayerOptions = {
    spacing: number;
    dotRadius: number;
    glowScale: number;
    opacity: number;
    /** Exponent on the field weight when deciding whether a grid cell keeps its dot. */
    densityGamma: number;
    /** Exponent on the field weight when deciding how bright a kept dot is. */
    brightnessGamma: number;
    /** Keeps the two layers from thinning out identically. */
    seed: number;
    /** Baked-in blur, so the animated pass never pays for a filter. */
    blur?: number;
};

/** Everything the animation loop needs to know about the current layout. */
type FieldGeometry = {
    width: number;
    height: number;
    lobeX: [number, number];
    lobeRadius: number;
};

const clamp = (value: number, min: number, max: number) =>
    value < min ? min : value > max ? max : value;

const smoothstep = (edge0: number, edge1: number, x: number) => {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
};

/** Stable per-cell value in [0, 1) — same cell always yields the same number, so nothing flickers. */
const cellNoise = (col: number, row: number, seed: number) => {
    let h = Math.imul(col, 0x27d4eb2d) ^ Math.imul(row, 0x165667b1) ^ Math.imul(seed, 0x9e3779b1);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Sideways profile: zero behind the mockup, peaking just off its edge, fading out at the page edge. */
const horizontalProfile = (t: number, edgeRamp: number, falloff: number) =>
    smoothstep(0, edgeRamp, t) * Math.pow(1 - t, falloff);

const horizontalPeak = (edgeRamp: number, falloff: number) => {
    let peak = 0;
    for (let i = 0; i <= 256; i++) {
        peak = Math.max(peak, horizontalProfile(i / 256, edgeRamp, falloff));
    }
    return peak || 1;
};

/** Resolves any CSS colour to an rgb triple so gradient stops never interpolate through black. */
const resolveRgb = (color: string): [number, number, number] => {
    const probe = document.createElement("canvas");
    probe.width = 1;
    probe.height = 1;
    const ctx = probe.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [255, 122, 26];
    ctx.fillStyle = "#ff7a1a";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
};

/**
 * One dot, pre-rendered once and stamped thousands of times. The gradient carries the bloom, so a
 * dot and its glow cost a single drawImage instead of a per-dot gradient.
 */
const createDotSprite = (
    rgb: [number, number, number],
    dotRadius: number,
    glowScale: number,
    dpr: number,
) => {
    const outerRadius = dotRadius * glowScale;
    const size = Math.max(2, Math.ceil(outerRadius * 2 * dpr));
    const sprite = document.createElement("canvas");
    sprite.width = size;
    sprite.height = size;

    const ctx = sprite.getContext("2d");
    if (!ctx) return { sprite, radius: outerRadius };

    const mid = size / 2;
    const core = clamp(dotRadius / outerRadius, 0.05, 0.9);
    const rgba = (alpha: number) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

    const gradient = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid);
    gradient.addColorStop(0, rgba(1));
    gradient.addColorStop(core * 0.8, rgba(0.94));
    gradient.addColorStop(core, rgba(0.42));
    gradient.addColorStop(core + (1 - core) * 0.4, rgba(0.1));
    gradient.addColorStop(1, rgba(0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    return { sprite, radius: outerRadius };
};

export default function AmbientDotField({
    className,
    spacing = 9,
    dotRadius = 1,
    color = "#ff7a1a",
    bloomColor,
    maxOpacity = 0.7,
    clearWidthRatio = 0.5,
    clearWidthMax = 1040,
    clearTop = 0.5,
    clearTopOffset,
    capStrength = 0.45,
    capReach = 0.16,
    verticalCenter = 0.62,
    verticalSpread = 0.62,
    horizontalFalloff = 0.85,
    edgeRamp = 0.06,
    bloom = true,
    bloomStrength = 0.26,
    bloomBlur = 5,
    glowSeconds = 9,
    glowDepth = 0.45,
}: AmbientDotFieldProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sharpRef = useRef<HTMLCanvasElement>(null);
    const bloomRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        const sharpCanvas = sharpRef.current;
        if (!container || !sharpCanvas) return;

        const sharpRgb = resolveRgb(color);
        const bloomRgb = bloomColor ? resolveRgb(bloomColor) : sharpRgb;

        let dpr = 1;
        let geometry: FieldGeometry | null = null;
        let sharpField: HTMLCanvasElement | null = null;
        let bloomField: HTMLCanvasElement | null = null;

        /**
         * Paints the whole dot grid once, into an offscreen canvas. This is the expensive pass —
         * thousands of sprite stamps — and it only reruns on resize.
         */
        const buildField = (
            rgb: [number, number, number],
            width: number,
            height: number,
            options: LayerOptions,
        ) => {
            const field = document.createElement("canvas");
            field.width = Math.max(1, Math.round(width * dpr));
            field.height = Math.max(1, Math.round(height * dpr));

            const ctx = field.getContext("2d");
            if (!ctx) return field;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const { sprite, radius } = createDotSprite(
                rgb,
                options.dotRadius,
                options.glowScale,
                dpr,
            );
            const drawSize = radius * 2;

            const halfWidth = width / 2;
            const clearHalf = Math.min(width * clearWidthRatio, clearWidthMax) / 2;
            const sideSpan = Math.max(1, halfWidth - clearHalf);
            const peak = horizontalPeak(edgeRamp, horizontalFalloff);
            const topEdge =
                clearTopOffset === undefined ? height * clearTop : height - clearTopOffset;
            const capSpan = Math.max(1, height * capReach);

            // Centre the grid on the container so the two sides mirror each other exactly.
            const columns = Math.floor(width / options.spacing) + 1;
            const rows = Math.floor(height / options.spacing) + 1;
            const originX = (width - (columns - 1) * options.spacing) / 2;
            const originY = (height - (rows - 1) * options.spacing) / 2;

            for (let row = 0; row < rows; row++) {
                const y = originY + row * options.spacing;
                const vertical = (y / height - verticalCenter) / verticalSpread;
                const weightY = Math.exp(-vertical * vertical * 1.8);

                // A shallow band that hugs the mockup's top edge and fades out going up, so the
                // side clouds appear to arc over the window instead of stopping at its corners.
                const capT = clamp((topEdge - y) / capSpan, 0, 1);
                const capBand =
                    capStrength > 0 && y < topEdge
                        ? (horizontalProfile(capT, edgeRamp, horizontalFalloff) / peak) *
                          capStrength
                        : 0;

                if (weightY < 0.01 && capBand <= 0.001) continue;

                for (let col = 0; col < columns; col++) {
                    const x = originX + col * options.spacing;
                    const offset = Math.abs(x - halfWidth);
                    const t = clamp((offset - clearHalf) / sideSpan, 0, 1);
                    const side =
                        (horizontalProfile(t, edgeRamp, horizontalFalloff) / peak) * weightY;

                    // Thinning the cap toward the middle keeps the corners densest; taking the
                    // larger of the two lets it blend into the side clouds with no seam.
                    const cap = capBand * (0.6 + 0.4 * smoothstep(0, clearHalf, offset));

                    const weight = Math.max(side, cap);
                    if (weight <= 0.001) continue;

                    // Thinning and dimming both track the same field, which is what turns a
                    // rectangle of dots into a soft oval cloud. Thinning is deliberately gentle —
                    // it only bites at the faint fringe, so the grid never looks like scattered
                    // particles.
                    if (cellNoise(col, row, options.seed) > Math.pow(weight, options.densityGamma))
                        continue;

                    const alpha = options.opacity * Math.pow(weight, options.brightnessGamma);
                    if (alpha < 0.012) continue;

                    ctx.globalAlpha = Math.min(alpha, 1);
                    ctx.drawImage(sprite, x - radius, y - radius, drawSize, drawSize);
                }
            }
            ctx.globalAlpha = 1;

            if (!options.blur) return field;

            // Bake the blur in now rather than paying for a CSS filter on every animated frame.
            const blurred = document.createElement("canvas");
            blurred.width = field.width;
            blurred.height = field.height;
            const blurredCtx = blurred.getContext("2d");
            if (!blurredCtx) return field;
            blurredCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
            blurredCtx.filter = `blur(${options.blur}px)`;
            blurredCtx.drawImage(field, 0, 0, width, height);
            return blurred;
        };

        const sizeCanvas = (canvas: HTMLCanvasElement, width: number, height: number) => {
            canvas.width = Math.max(1, Math.round(width * dpr));
            canvas.height = Math.max(1, Math.round(height * dpr));
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        };

        const layout = () => {
            const { width, height } = container.getBoundingClientRect();
            if (width < 1 || height < 1) return false;

            dpr = Math.min(window.devicePixelRatio || 1, 2);

            const halfWidth = width / 2;
            const clearHalf = Math.min(width * clearWidthRatio, clearWidthMax) / 2;
            const sideSpan = Math.max(1, halfWidth - clearHalf);

            geometry = {
                width,
                height,
                // The glow lobes sit mid-way out on each side rather than on the mockup edge, so
                // the animation adds variation instead of re-emphasising what the grid already does.
                lobeX: [
                    halfWidth - clearHalf - sideSpan * 0.45,
                    halfWidth + clearHalf + sideSpan * 0.45,
                ],
                lobeRadius: Math.max(sideSpan, height * 0.55) * 1.25,
            };

            sharpField = buildField(sharpRgb, width, height, {
                spacing,
                dotRadius,
                glowScale: 3,
                opacity: maxOpacity,
                densityGamma: 0.4,
                brightnessGamma: 1.15,
                seed: 1,
            });
            sizeCanvas(sharpCanvas, width, height);

            if (bloom && bloomRef.current) {
                bloomField = buildField(bloomRgb, width, height, {
                    spacing: spacing * 2,
                    dotRadius: dotRadius * 2.2,
                    glowScale: 2.6,
                    opacity: maxOpacity * bloomStrength,
                    densityGamma: 0.6,
                    brightnessGamma: 1.2,
                    seed: 2,
                    blur: bloomBlur,
                });
                sizeCanvas(bloomRef.current, width, height);
            }

            return true;
        };

        /** Two detuned sines, so a lobe's glow never lands on an obvious loop point. */
        const energyAt = (seconds: number, phase: number) => {
            const a = Math.sin((2 * Math.PI * seconds) / glowSeconds + phase);
            const b = Math.sin((2 * Math.PI * seconds) / (glowSeconds * 1.63) + phase * 1.7);
            return 0.5 + 0.5 * (a * 0.6 + b * 0.4);
        };

        /**
         * Draws one animated frame of a layer: paint the swelling energy gradient over each side,
         * then keep only the pixels the dot grid occupies. Two fills and one stamp, whatever the
         * dot count — the per-dot brightness falls out of the mask.
         */
        const composite = (
            canvas: HTMLCanvasElement,
            field: HTMLCanvasElement,
            rgb: [number, number, number],
            seconds: number,
            phaseOffset: number,
            still: boolean,
        ) => {
            if (!geometry) return;
            const { width, height, lobeX, lobeRadius } = geometry;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const rgba = (alpha: number) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.globalCompositeOperation = "source-over";
            ctx.clearRect(0, 0, width, height);

            for (let side = 0; side < 2; side++) {
                // A small offset between the sides keeps them from pulsing in lockstep without
                // letting one side go dark while the other is lit.
                const energy = still ? 0.5 : energyAt(seconds, phaseOffset + side * 0.9);
                const inner = 1 - glowDepth * (1 - energy);
                const outer = inner * 0.7;
                const centreY = height * verticalCenter + (energy - 0.5) * height * 0.05;
                const radius = lobeRadius * (0.8 + 0.32 * energy);

                const gradient = ctx.createRadialGradient(
                    lobeX[side],
                    centreY,
                    0,
                    lobeX[side],
                    centreY,
                    radius,
                );
                gradient.addColorStop(0, rgba(inner));
                gradient.addColorStop(1, rgba(outer));
                ctx.fillStyle = gradient;
                ctx.fillRect(side === 0 ? 0 : width / 2, 0, width / 2, height);
            }

            ctx.globalCompositeOperation = "destination-in";
            ctx.drawImage(field, 0, 0, width, height);
            ctx.globalCompositeOperation = "source-over";
        };

        const draw = (seconds: number, still: boolean) => {
            if (sharpField) composite(sharpCanvas, sharpField, sharpRgb, seconds, 0, still);
            // A different phase on the blurred layer makes the halo swell out of step with the
            // dots, which is what reads as glow rather than a plain fade.
            if (bloomField && bloomRef.current) {
                composite(bloomRef.current, bloomField, bloomRgb, seconds, 1.35, still);
            }
        };

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

        let frame = 0;
        let start = 0;
        let lastDraw = 0;

        const tick = (now: number) => {
            if (!start) start = now;
            // The glow moves slowly enough that 30fps is indistinguishable from 60, and it halves
            // the fill cost on large viewports.
            if (now - lastDraw >= 32) {
                lastDraw = now;
                draw((now - start) / 1000, false);
            }
            frame = requestAnimationFrame(tick);
        };

        const run = () => {
            cancelAnimationFrame(frame);
            frame = 0;
            start = 0;
            lastDraw = 0;
            if (reducedMotion.matches || glowDepth <= 0) {
                draw(0, true);
                return;
            }
            frame = requestAnimationFrame(tick);
        };

        const restart = () => {
            if (layout()) run();
        };

        restart();

        let resizeFrame = 0;
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(restart);
        });
        observer.observe(container);
        reducedMotion.addEventListener("change", run);

        return () => {
            cancelAnimationFrame(frame);
            cancelAnimationFrame(resizeFrame);
            observer.disconnect();
            reducedMotion.removeEventListener("change", run);
        };
    }, [
        spacing,
        dotRadius,
        color,
        bloomColor,
        maxOpacity,
        clearWidthRatio,
        clearWidthMax,
        clearTop,
        clearTopOffset,
        capStrength,
        capReach,
        verticalCenter,
        verticalSpread,
        horizontalFalloff,
        edgeRamp,
        bloom,
        bloomStrength,
        bloomBlur,
        glowSeconds,
        glowDepth,
    ]);

    return (
        <div
            ref={containerRef}
            aria-hidden="true"
            className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
        >
            {bloom ? <canvas ref={bloomRef} className="absolute inset-0 h-full w-full" /> : null}
            <canvas ref={sharpRef} className="absolute inset-0 h-full w-full" />
        </div>
    );
}
