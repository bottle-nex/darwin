"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const PARTICLE_DENSITY = 0.5;
const MIN_PARTICLES = 165;
const MAX_PARTICLES = 560;

const PARTICLE_RADIUS = 1.2;
const LINK_DISTANCE = 90;
const LINK_OPACITY = 0.9;
const LINK_WIDTH = 0.5;
const GRAB_DISTANCE = 120;
const GRAB_OPACITY = 1;
const DRIFT_SPEED = 0.25;
const FRAME_MS = 1000 / 60;
const MAX_CANVAS_SIDE = 8192;

type Particle = { x: number; y: number; vx: number; vy: number };

type ParticleFieldProps = {
    className?: string;
    color?: string;
};

export default function ParticleField({ className, color = "#ffffff" }: ParticleFieldProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        const surface = canvas?.parentElement;
        if (!canvas || !context || !surface) return;

        let width = 0;
        let height = 0;

        const area = (window.innerWidth * window.innerHeight) / 1000;
        const count = Math.min(
            MAX_PARTICLES,
            Math.max(MIN_PARTICLES, Math.round(area * PARTICLE_DENSITY)),
        );
        const particles: Particle[] = Array.from({ length: count }, () => ({
            x: Math.random(),
            y: Math.random(),
            vx: (Math.random() - 0.5) * DRIFT_SPEED,
            vy: (Math.random() - 0.5) * DRIFT_SPEED,
        }));

        const pointer = { clientX: 0, clientY: 0, active: false };

        const trackPointer = (event: PointerEvent) => {
            pointer.clientX = event.clientX;
            pointer.clientY = event.clientY;
            pointer.active = true;
        };

        const releasePointer = () => {
            pointer.active = false;
        };

        const draw = () => {
            context.clearRect(0, 0, width, height);
            context.fillStyle = color;
            context.strokeStyle = color;
            context.lineWidth = LINK_WIDTH;

            const rect = canvas.getBoundingClientRect();
            const grabX = ((pointer.clientX - rect.left) / rect.width) * width;
            const grabY = ((pointer.clientY - rect.top) / rect.height) * height;
            const grabbing =
                pointer.active && grabX >= 0 && grabY >= 0 && grabX <= width && grabY <= height;

            for (let i = 0; i < particles.length; i++) {
                const x = particles[i].x * width;
                const y = particles[i].y * height;

                context.beginPath();
                context.arc(x, y, PARTICLE_RADIUS, 0, Math.PI * 2);
                context.fill();

                if (grabbing) {
                    const reach = Math.hypot(x - grabX, y - grabY);
                    if (reach <= GRAB_DISTANCE) {
                        context.globalAlpha = GRAB_OPACITY * (1 - reach / GRAB_DISTANCE);
                        context.beginPath();
                        context.moveTo(x, y);
                        context.lineTo(grabX, grabY);
                        context.stroke();
                        context.globalAlpha = 1;
                    }
                }

                for (let j = i + 1; j < particles.length; j++) {
                    const dx = x - particles[j].x * width;
                    const dy = y - particles[j].y * height;
                    const distance = Math.hypot(dx, dy);
                    if (distance > LINK_DISTANCE) continue;

                    context.globalAlpha = LINK_OPACITY * (1 - distance / LINK_DISTANCE);
                    context.beginPath();
                    context.moveTo(x, y);
                    context.lineTo(x - dx, y - dy);
                    context.stroke();
                    context.globalAlpha = 1;
                }
            }
        };

        const resize = () => {
            const rect = surface.getBoundingClientRect();
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            const nextWidth = Math.min(Math.round(rect.width * ratio), MAX_CANVAS_SIDE);
            const nextHeight = Math.min(Math.round(rect.height * ratio), MAX_CANVAS_SIDE);
            if (!nextWidth || !nextHeight) return;
            if (canvas.width === nextWidth && canvas.height === nextHeight) return;

            canvas.width = nextWidth;
            canvas.height = nextHeight;
            width = nextWidth / ratio;
            height = nextHeight / ratio;
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            draw();
        };

        resize();

        const observer = new ResizeObserver(resize);
        observer.observe(surface);

        window.addEventListener("pointermove", trackPointer);
        window.addEventListener("pointerleave", releasePointer);

        let frame = 0;
        let previousTime = 0;

        const step = (time: number) => {
            const elapsed = previousTime ? Math.min((time - previousTime) / FRAME_MS, 3) : 1;
            previousTime = time;
            const delta = prefersReducedMotion ? 0 : elapsed;

            for (const particle of particles) {
                particle.x = wrap(particle.x + (particle.vx * delta) / width);
                particle.y = wrap(particle.y + (particle.vy * delta) / height);
            }

            draw();
            frame = requestAnimationFrame(step);
        };

        frame = requestAnimationFrame(step);

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener("pointermove", trackPointer);
            window.removeEventListener("pointerleave", releasePointer);
        };
    }, [color, prefersReducedMotion]);

    return <canvas ref={canvasRef} className={cn("block", className)} aria-hidden />;
}

function wrap(value: number) {
    if (value < 0) return value + 1;
    if (value > 1) return value - 1;
    return value;
}
