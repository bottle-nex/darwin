"use client";

import { useEffect, useRef } from "react";

/**
 * Renders a trio of 3D turbine fans as an ASCII halftone: blade surfaces are
 * sampled as point clouds, rotated (blade spin + whole-assembly tumble),
 * perspective-projected onto a character grid, and z-buffered so the nearest
 * surface wins each cell. Surface shading (normal · light) picks the glyph —
 * lit faces render as hollow dots, shaded faces as filled ones.
 */

const CELL_W = 8;
const CELL_H = 9;
const FONT_SIZE = 10.5;
const FRAME_MS = 1000 / 30;

// Dimmest → brightest on the dark background; indexed by surface brightness.
const GLYPH_RAMP = ["·", "◦", "o", "o", "0", "0", "●"];
const GLYPH_ALPHA = [0.3, 0.5, 0.7, 0.78, 0.88, 0.92, 1];
const EMPTY_CELL = 255;

const RADIAL_STEPS = 30;
const CHORD_STEPS = 13;
const HUB_RINGS = 6;

const LIGHT_DIR = normalize([0.35, 0.55, 0.76]);
const CAMERA_DIST = 6;
// --color-snow glyphs on the site's bg-ink.
const GLYPH_COLOR = "245, 245, 245";

type Vec3 = [number, number, number];
type Mat3 = Float64Array;

type FanSpec = {
    offset: Vec3;
    radius: number;
    blades: number;
    orientX: number;
    orientY: number;
    spinSpeed: number;
    spinPhase: number;
};

// Left and right main rotors counter-spin; a smaller third sits high and behind.
const FAN_SPECS: FanSpec[] = [
    {
        offset: [-1.15, -0.12, 0.15],
        radius: 1.05,
        blades: 5,
        orientX: 0.35,
        orientY: 0.55,
        spinSpeed: 1.05,
        spinPhase: 0,
    },
    {
        offset: [1.1, 0, -0.15],
        radius: 1.15,
        blades: 5,
        orientX: -0.25,
        orientY: -0.5,
        spinSpeed: -0.8,
        spinPhase: 0.7,
    },
    {
        offset: [0.05, 0.6, -0.75],
        radius: 0.72,
        blades: 6,
        orientX: 0.9,
        orientY: 0.15,
        spinSpeed: 1.45,
        spinPhase: 1.9,
    },
];

function normalize(v: Vec3): Vec3 {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
}

function rotX(a: number): Mat3 {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return new Float64Array([1, 0, 0, 0, c, -s, 0, s, c]);
}

function rotY(a: number): Mat3 {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return new Float64Array([c, 0, s, 0, 1, 0, -s, 0, c]);
}

function rotZ(a: number): Mat3 {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return new Float64Array([c, -s, 0, s, c, 0, 0, 0, 1]);
}

function mat3Mul(a: Mat3, b: Mat3): Mat3 {
    const out = new Float64Array(9);
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            out[row * 3 + col] =
                a[row * 3] * b[col] + a[row * 3 + 1] * b[3 + col] + a[row * 3 + 2] * b[6 + col];
        }
    }
    return out;
}

/**
 * A blade is a petal-shaped surface swept around the hub: narrow at the root,
 * broad and rounded at the tip, curved backwards (sweep), twisted so the pitch
 * relaxes toward the tip, and slightly cupped across the chord (camber).
 */
function bladePoint(spec: FanSpec, baseAngle: number, u: number, v: number, out: number[]) {
    const hubRadius = spec.radius * 0.16;
    const r = hubRadius * 0.9 + (spec.radius - hubRadius * 0.9) * u;
    const halfWidth =
        (Math.PI / spec.blades) * 0.78 * Math.pow(Math.sin(Math.PI * (0.06 + 0.94 * u)), 0.6);
    const sweep = 0.55 * u * u;
    const pitch = 0.85 - 0.45 * u;
    const chord = halfWidth * r;
    const theta = baseAngle + sweep + (v * chord * Math.cos(pitch)) / r;
    const camber = 0.15 * (1 - v * v) * chord;

    out[0] = r * Math.cos(theta);
    out[1] = r * Math.sin(theta);
    out[2] = v * chord * Math.sin(pitch) + camber;
}

/** Interleaved [px, py, pz, nx, ny, nz] samples for one fan in its local space. */
function buildFanGeometry(spec: FanSpec): Float32Array {
    const points: number[] = [];
    const p = [0, 0, 0];
    const pu = [0, 0, 0];
    const pv = [0, 0, 0];
    const EPS = 1e-3;

    for (let blade = 0; blade < spec.blades; blade++) {
        const baseAngle = (blade * Math.PI * 2) / spec.blades;
        for (let i = 0; i <= RADIAL_STEPS; i++) {
            const u = i / RADIAL_STEPS;
            for (let j = 0; j <= CHORD_STEPS; j++) {
                const v = (j / CHORD_STEPS) * 2 - 1;
                bladePoint(spec, baseAngle, u, v, p);
                bladePoint(spec, baseAngle, Math.min(u + EPS, 1), v, pu);
                bladePoint(spec, baseAngle, u, v + EPS, pv);

                const dux = pu[0] - p[0];
                const duy = pu[1] - p[1];
                const duz = pu[2] - p[2];
                const dvx = pv[0] - p[0];
                const dvy = pv[1] - p[1];
                const dvz = pv[2] - p[2];
                const [nx, ny, nz] = normalize([
                    duy * dvz - duz * dvy,
                    duz * dvx - dux * dvz,
                    dux * dvy - duy * dvx,
                ]);
                points.push(p[0], p[1], p[2], nx, ny, nz);
            }
        }
    }

    // Hub: a shallow dome capping the blade roots.
    const hubRadius = spec.radius * 0.17;
    const hubDepth = hubRadius * 0.6;
    points.push(0, 0, hubDepth, 0, 0, 1);
    for (let ring = 1; ring <= HUB_RINGS; ring++) {
        const a = (hubRadius * ring) / HUB_RINGS;
        const z = hubDepth * Math.sqrt(Math.max(0, 1 - (a / hubRadius) ** 2));
        const count = 6 + ring * 5;
        for (let k = 0; k < count; k++) {
            const phi = (k * Math.PI * 2) / count;
            const x = a * Math.cos(phi);
            const y = a * Math.sin(phi);
            const [nx, ny, nz] = normalize([
                x / (hubRadius * hubRadius),
                y / (hubRadius * hubRadius),
                z / (hubDepth * hubDepth) || 1e-4,
            ]);
            points.push(x, y, z, nx, ny, nz);
        }
    }

    return new Float32Array(points);
}

export default function AsciiFanCanvas({ className }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const geometries = FAN_SPECS.map(buildFanGeometry);
        const fontFamily = getComputedStyle(canvas).fontFamily || "monospace";

        let cols = 0;
        let rows = 0;
        let depthBuffer = new Float32Array(0);
        let glyphBuffer = new Uint8Array(0);
        let rafId = 0;
        let running = false;
        let lastDrawn = 0;
        let elapsed = 0;
        let lastTick = 0;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        function resize() {
            if (!canvas) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const { width, height } = canvas.getBoundingClientRect();
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx!.font = `${FONT_SIZE}px ${fontFamily}`;
            ctx!.textAlign = "center";
            ctx!.textBaseline = "middle";
            cols = Math.max(1, Math.floor(width / CELL_W));
            rows = Math.max(1, Math.floor(height / CELL_H));
            depthBuffer = new Float32Array(cols * rows);
            glyphBuffer = new Uint8Array(cols * rows);
        }

        function renderFrame(t: number) {
            if (!canvas) return;
            const width = canvas.getBoundingClientRect().width;
            const height = canvas.getBoundingClientRect().height;
            const unit = Math.min(width / 4.6, height / 3.2);
            const cx = (cols * CELL_W) / 2;
            const cy = (rows * CELL_H) / 2;

            depthBuffer.fill(-Infinity);
            glyphBuffer.fill(EMPTY_CELL);

            // The whole assembly tumbles: continuous yaw with a breathing tilt.
            const sceneRot = mat3Mul(
                rotY(t * 0.42),
                mat3Mul(rotX(0.32 * Math.sin(t * 0.21) + 0.18), rotZ(0.08 * Math.sin(t * 0.13))),
            );

            for (let f = 0; f < FAN_SPECS.length; f++) {
                const spec = FAN_SPECS[f];
                const geometry = geometries[f];
                const spin = rotZ(spec.spinPhase + t * spec.spinSpeed);
                const orient = mat3Mul(rotY(spec.orientY), rotX(spec.orientX));
                const m = mat3Mul(sceneRot, mat3Mul(orient, spin));

                const ox =
                    sceneRot[0] * spec.offset[0] +
                    sceneRot[1] * spec.offset[1] +
                    sceneRot[2] * spec.offset[2];
                const oy =
                    sceneRot[3] * spec.offset[0] +
                    sceneRot[4] * spec.offset[1] +
                    sceneRot[5] * spec.offset[2];
                const oz =
                    sceneRot[6] * spec.offset[0] +
                    sceneRot[7] * spec.offset[1] +
                    sceneRot[8] * spec.offset[2];

                for (let i = 0; i < geometry.length; i += 6) {
                    const px = geometry[i];
                    const py = geometry[i + 1];
                    const pz = geometry[i + 2];
                    const x = m[0] * px + m[1] * py + m[2] * pz + ox;
                    const y = m[3] * px + m[4] * py + m[5] * pz + oy;
                    const z = m[6] * px + m[7] * py + m[8] * pz + oz;

                    const persp = CAMERA_DIST / (CAMERA_DIST - z);
                    const col = Math.round(cx / CELL_W + (x * persp * unit) / CELL_W - 0.5);
                    const row = Math.round(cy / CELL_H - (y * persp * unit) / CELL_H - 0.5);
                    if (col < 0 || col >= cols || row < 0 || row >= rows) continue;

                    const cell = row * cols + col;
                    if (z <= depthBuffer[cell]) continue;
                    depthBuffer[cell] = z;

                    const nx = geometry[i + 3];
                    const ny = geometry[i + 4];
                    const nz = geometry[i + 5];
                    const wnx = m[0] * nx + m[1] * ny + m[2] * nz;
                    const wny = m[3] * nx + m[4] * ny + m[5] * nz;
                    const wnz = m[6] * nx + m[7] * ny + m[8] * nz;

                    const lambert = wnx * LIGHT_DIR[0] + wny * LIGHT_DIR[1] + wnz * LIGHT_DIR[2];
                    const brightness = 0.5 + 0.5 * lambert;
                    glyphBuffer[cell] = Math.min(
                        GLYPH_RAMP.length - 1,
                        Math.floor(brightness * GLYPH_RAMP.length),
                    );
                }
            }

            ctx!.clearRect(0, 0, cols * CELL_W, rows * CELL_H);
            for (let ramp = 0; ramp < GLYPH_RAMP.length; ramp++) {
                ctx!.fillStyle = `rgba(${GLYPH_COLOR}, ${GLYPH_ALPHA[ramp]})`;
                const glyph = GLYPH_RAMP[ramp];
                for (let cell = 0; cell < glyphBuffer.length; cell++) {
                    if (glyphBuffer[cell] !== ramp) continue;
                    const col = cell % cols;
                    const row = (cell / cols) | 0;
                    ctx!.fillText(glyph, (col + 0.5) * CELL_W, (row + 0.5) * CELL_H);
                }
            }
        }

        function loop(now: number) {
            if (!running) return;
            rafId = requestAnimationFrame(loop);
            if (now - lastDrawn < FRAME_MS) return;
            if (lastTick) elapsed += Math.min(now - lastTick, 100) / 1000;
            lastTick = now;
            lastDrawn = now;
            renderFrame(elapsed);
        }

        function start() {
            if (running || reducedMotion) return;
            running = true;
            lastTick = 0;
            rafId = requestAnimationFrame(loop);
        }

        function stop() {
            running = false;
            cancelAnimationFrame(rafId);
        }

        const resizeObserver = new ResizeObserver(() => {
            resize();
            renderFrame(elapsed || 1.7);
        });
        resizeObserver.observe(canvas);

        const visibility = new IntersectionObserver(
            ([entry]) => (entry.isIntersecting ? start() : stop()),
            { rootMargin: "100px" },
        );
        visibility.observe(canvas);

        resize();
        renderFrame(1.7);

        return () => {
            stop();
            resizeObserver.disconnect();
            visibility.disconnect();
        };
    }, []);

    return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
