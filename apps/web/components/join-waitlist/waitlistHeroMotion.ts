import type { MotionValue } from "motion/react";

import type { HeroPhase } from "@/types/waitlistHero.type";

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const INTRO_AT = {
    tile: 0.95,
    shine: 1.55,
    headline: 1.2,
    button: 1.95,
};

export type HeroMotion = {
    phase: HeroPhase;
    reduceMotion: boolean;
    parallaxX: MotionValue<number>;
    parallaxY: MotionValue<number>;
};
