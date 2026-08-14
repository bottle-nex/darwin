"use client";

import { useEffect, useRef } from "react";

/**
 * Draws an isometric cluster of rounded monolith slabs as a 1-bit dither.
 * A grayscale scene (extruded round-capped columns with shaded faces) is
 * rendered offscreen at cell resolution, then quantized through an 8x8 Bayer
 * matrix with deterministic hash noise — producing the pixel-grain halftone.
 * The lower edge dissolves into scattered pixels. Static; redrawn on resize.
 */

const CELL = 4;
const DOT = 3;

const INK_DOT = "#161616";
const GRAY_DOT = "#8c8c89";

// prettier-ignore
const BAYER_8 = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
];

/** Deterministic per-cell noise so the grain doesn't reshuffle on re-render. */
function hashNoise(x: number, y: number): number {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = ((h ^ (h >>> 13)) * 1274126177) | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

type Slab = {
    /** Fractions of canvas width/height; bottom may exceed 1 (cropped + dissolved). */
    x: number;
    top: number;
    bottom: number;
    width: number;
};

// Staggered diagonal like stacked book spines: the tallest is cropped by the
// panel's top edge, stepping down-right, the last column running past bottom.
const SLABS: Slab[] = [
    { x: 0.26, top: -0.14, bottom: 0.4, width: 0.34 },
    { x: 0.55, top: -0.04, bottom: 0.56, width: 0.3 },
    { x: 0.82, top: 0.1, bottom: 0.74, width: 0.28 },
    { x: 1.07, top: 0.26, bottom: 1.05, width: 0.26 },
];

// Extrusion direction (up-left, isometric) in cells per step.
const EXTRUDE_X = -0.87;
const EXTRUDE_Y = -0.5;

function drawCapsule(
    scene: CanvasRenderingContext2D,
    x: number,
    yTop: number,
    yBottom: number,
    width: number,
    style: string | CanvasGradient,
) {
    scene.strokeStyle = style;
    scene.lineWidth = width;
    scene.lineCap = "round";
    scene.beginPath();
    scene.moveTo(x, yTop + width / 2);
    scene.lineTo(x, yBottom);
    scene.stroke();
}

function drawScene(scene: CanvasRenderingContext2D, cols: number, rows: number) {
    scene.fillStyle = "#ffffff";
    scene.fillRect(0, 0, cols, rows);

    for (const slab of SLABS) {
        const width = slab.width * cols;
        const x = slab.x * cols;
        const yTop = slab.top * rows;
        const yBottom = slab.bottom * rows;
        const depth = Math.round(cols * 0.11);

        // Back-to-front extrusion: the visible band around the cap and along
        // the left edge, darkest just behind the front face.
        for (let k = depth; k >= 1; k--) {
            const t = k / depth;
            const g = Math.round(255 * (0.14 + 0.3 * t));
            drawCapsule(
                scene,
                x + k * EXTRUDE_X,
                yTop + k * EXTRUDE_Y,
                yBottom + k * EXTRUDE_Y,
                width,
                `rgb(${g},${g},${g})`,
            );
        }

        // Front face: lit at the top of the cap, falling into shadow below.
        const grad = scene.createLinearGradient(0, yTop, 0, yBottom);
        grad.addColorStop(0, "rgb(204,204,204)");
        grad.addColorStop(0.45, "rgb(122,122,122)");
        grad.addColorStop(1, "rgb(66,66,66)");
        drawCapsule(scene, x, yTop, yBottom, width, grad);
    }
}

export default function DitherStructureCanvas({ className }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        function render() {
            if (!canvas || !ctx) return;
            const { width, height } = canvas.getBoundingClientRect();
            if (width < CELL || height < CELL) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const cols = Math.floor(width / CELL);
            const rows = Math.floor(height / CELL);

            const offscreen = document.createElement("canvas");
            offscreen.width = cols;
            offscreen.height = rows;
            const scene = offscreen.getContext("2d", { willReadFrequently: true });
            if (!scene) return;
            drawScene(scene, cols, rows);
            const pixels = scene.getImageData(0, 0, cols, rows).data;

            ctx.clearRect(0, 0, width, height);
            for (let row = 0; row < rows; row++) {
                const rowFrac = row / rows;
                // Dissolve toward the bottom edge into stray pixels.
                const dissolve = Math.max(0, (rowFrac - 0.6) / 0.4);
                for (let col = 0; col < cols; col++) {
                    const v = pixels[(row * cols + col) * 4] / 255;
                    if (v > 0.97) continue;

                    const threshold = (BAYER_8[row % 8][col % 8] + 0.5) / 64;
                    const jitter = (hashNoise(col, row) - 0.5) * 0.24;
                    if (v + jitter >= threshold) continue;
                    if (dissolve > 0 && hashNoise(col * 7 + 3, row * 5 + 11) < dissolve * 0.94) {
                        continue;
                    }

                    ctx.fillStyle = v < 0.45 ? INK_DOT : GRAY_DOT;
                    ctx.fillRect(col * CELL, row * CELL, DOT, DOT);
                }
            }
        }

        const resizeObserver = new ResizeObserver(render);
        resizeObserver.observe(canvas);
        render();

        return () => resizeObserver.disconnect();
    }, []);

    return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
