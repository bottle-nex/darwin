"use client";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import Grainient from "@/components/Grainient";
import LandingHeroBoard from "@/components/new/LandingHeroBoard";
import {
    FRAME_FADE,
    GRAIN_FADE,
    HEADLINE_BODY,
    HEADLINE_GROUP,
    HEADLINE_LINE,
} from "@/components/new/landingHeroMotion";

const BORDER_INSET = 0.75;
const BORDER_RADIUS = 22;
const BORDER_TRACE_SECONDS = 2.0;

export default function LandingHero() {
    const reduceMotion = useReducedMotion();
    const initial = reduceMotion ? false : "hidden";
    const frameRef = useRef<HTMLDivElement>(null);
    const [frame, setFrame] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const el = frameRef.current;
        if (!el) return;
        const measure = () =>
            setFrame((previous) =>
                previous.width === el.offsetWidth && previous.height === el.offsetHeight
                    ? previous
                    : { width: el.offsetWidth, height: el.offsetHeight },
            );
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const inset = BORDER_INSET;
    const radius = BORDER_RADIUS;
    const cornerX = inset;
    const cornerY = inset + radius;
    const topPath = `M ${cornerX} ${cornerY} A ${radius} ${radius} 0 0 1 ${inset + radius} ${inset} H ${frame.width - inset - radius} A ${radius} ${radius} 0 0 1 ${frame.width - inset} ${cornerY} V ${frame.height}`;
    const leftPath = `M ${cornerX} ${cornerY} V ${frame.height}`;
    const topLength = frame.width + frame.height - radius + Math.PI * radius;
    const leftLength = frame.height - radius;
    const leftSeconds = Math.max(0.7, BORDER_TRACE_SECONDS * (leftLength / topLength));

    return (
        <section className="relative h-svh min-h-275 w-full overflow-hidden text-snow">
            <motion.div
                initial={initial}
                animate="show"
                variants={GRAIN_FADE}
                className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_top,transparent_0,black_20rem)] after:absolute after:inset-0 after:bg-black/40"
            >
                <Grainient
                    color1="#0a0a0a"
                    color2="#ab9ff2"
                    color3="#0a0a0a"
                    timeSpeed={0.25}
                    colorBalance={0}
                    warpStrength={1}
                    warpFrequency={5}
                    warpSpeed={2}
                    warpAmplitude={50}
                    blendAngle={0}
                    blendSoftness={0.05}
                    rotationAmount={500}
                    noiseScale={2}
                    grainAmount={0.1}
                    grainScale={2}
                    grainAnimated={false}
                    contrast={1.5}
                    gamma={1}
                    saturation={1}
                    centerX={0}
                    centerY={0}
                    zoom={0.9}
                />
            </motion.div>
            <motion.div
                initial={initial}
                animate="show"
                variants={HEADLINE_GROUP}
                className="absolute inset-x-0 top-56 z-20 mx-auto max-w-7xl"
            >
                <motion.h1
                    variants={HEADLINE_LINE}
                    className="max-w-5xl text-5xl leading-[1.1] font-medium tracking-tight text-snow/90 font-headline"
                >
                    Where issues become verified pull requests without anyone picking up the ticket.
                </motion.h1>
                <motion.p
                    variants={HEADLINE_BODY}
                    className="mt-5 max-w-4xl text-[19px] leading-relaxed text-snow/80"
                >
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                    nostrud exercitation ullamco laboris nisi.
                </motion.p>
            </motion.div>
            <div
                ref={frameRef}
                className="absolute inset-x-0 top-110 bottom-0 z-10 mx-auto max-w-7xl"
            >
                {frame.width > 0 && (
                    <svg
                        className="pointer-events-none absolute inset-0 z-30 h-full w-full"
                        viewBox={`0 0 ${frame.width} ${frame.height}`}
                        fill="none"
                    >
                        <motion.path
                            d={topPath}
                            initial={reduceMotion ? false : { pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{
                                duration: BORDER_TRACE_SECONDS,
                                ease: "easeInOut",
                                delay: 0.15,
                            }}
                            stroke="rgba(255,255,255,0.15)"
                            strokeWidth="1.5"
                            style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.22))" }}
                        />
                        <motion.path
                            d={leftPath}
                            initial={reduceMotion ? false : { pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: leftSeconds, ease: "easeInOut", delay: 0.15 }}
                            stroke="rgba(255,255,255,0.15)"
                            strokeWidth="1.5"
                            style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.22))" }}
                        />
                    </svg>
                )}
                <motion.div
                    initial={initial}
                    animate="show"
                    variants={FRAME_FADE}
                    className="flex h-full flex-col rounded-t-[22px] overflow-hidden bg-linear-to-b from-[#1b1b1d] to-[#0c0c0d] pb-0"
                >
                    <div className="relative flex-1 overflow-hidden rounded-t-[21px] bg-[#070708]">
                        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-48 overflow-hidden">
                            <div className="absolute -top-24 left-[6%] h-72 w-[28%] rotate-[16deg] bg-linear-to-b from-white/14 to-transparent blur-2xl" />
                            <div className="absolute -top-28 left-[42%] h-80 w-[20%] rotate-[-10deg] bg-linear-to-b from-white/9 to-transparent blur-3xl" />
                            <div className="absolute -top-20 right-[8%] h-64 w-[26%] rotate-[14deg] bg-linear-to-b from-white/12 to-transparent blur-2xl" />
                            <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-white/6 to-transparent" />
                        </div>
                        <LandingHeroBoard />
                    </div>
                </motion.div>
            </div>

            {/*<LandingHeroNotifications />*/}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-linear-to-t from-ink from-8% via-ink/55 via-45% to-transparent" />
        </section>
    );
}
