"use client";

import { motion, useTransform } from "motion/react";

import type { HeroMotion } from "@/components/join-waitlist/waitlistHeroMotion";
import { APP_LOGO_PATH, APP_LOGO_SIZE } from "@/components/logo/AppLogo";

const BRAND_MARK = { width: 1000, dy: 100, depth: -8 };
const BRAND_MARK_FADE = "radial-gradient(ellipse at center, black 35%, transparent 80%)";

type Props = { color: string; heroMotion: HeroMotion };

export default function WaitlistHeroBrandMark({ color, heroMotion }: Props) {
    const { phase, reduceMotion } = heroMotion;
    const x = useTransform(heroMotion.parallaxX, (value) => value * BRAND_MARK.depth);
    const y = useTransform(heroMotion.parallaxY, (value) => value * BRAND_MARK.depth);
    const floating = phase === "idle" && !reduceMotion;

    return (
        <motion.div
            style={{ x, y, top: `calc(50% + ${BRAND_MARK.dy}px)` }}
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
            <motion.svg
                width={BRAND_MARK.width}
                viewBox={`0 0 ${APP_LOGO_SIZE.width} ${APP_LOGO_SIZE.height}`}
                aria-hidden="true"
                style={{ maskImage: BRAND_MARK_FADE, WebkitMaskImage: BRAND_MARK_FADE }}
                animate={floating ? { opacity: 1, y: [0, -6, 0] } : { opacity: 1 }}
                transition={
                    floating
                        ? { duration: 12, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0 }
                }
                className="block h-auto"
            >
                <defs>
                    <pattern
                        id="waitlist-hero-hatch"
                        width="3"
                        height="3"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(30)"
                    >
                        <line x1="0.5" y1="0" x2="0.5" y2="3" stroke="white" strokeOpacity="0.4" />
                    </pattern>
                </defs>
                <path d={APP_LOGO_PATH} fill={color} fillOpacity="0.22" />
                <path d={APP_LOGO_PATH} fill="url(#waitlist-hero-hatch)" />
            </motion.svg>
        </motion.div>
    );
}
