"use client";

import { useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { type PointerEvent, useState } from "react";

import WaitlistHeroBrandMark from "@/components/join-waitlist/WaitlistHeroBrandMark";
import WaitlistHeroGlow from "@/components/join-waitlist/WaitlistHeroGlow";
import WaitlistHeroHeadline from "@/components/join-waitlist/WaitlistHeroHeadline";
import type { HeroMotion } from "@/components/join-waitlist/waitlistHeroMotion";
import WaitlistHeroTile from "@/components/join-waitlist/WaitlistHeroTile";
import WaitlistJoinForm from "@/components/join-waitlist/WaitlistJoinForm";
import type { GlowBlob, HeroPhase } from "@/types/waitlistHero.type";

const BLUE = "#ab9ff2";

const BLOB_GRADIENT = `radial-gradient(closest-side, ${BLUE} 0%, ${BLUE} 70%, transparent 100%)`;

const GLOW_BLOBS: GlowBlob[] = [
    { dx: 0, dy: 22, width: 570, height: 463, opacity: 1 },
    { dx: 0, dy: -162, width: 442, height: 221, opacity: 0.9 },
    { dx: -162, dy: -110, width: 238, height: 196, opacity: 0.8 },
    { dx: 196, dy: -128, width: 285, height: 212, opacity: 0.85 },
    { dx: -298, dy: 68, width: 255, height: 255, opacity: 0.8 },
    { dx: 306, dy: 53, width: 255, height: 269, opacity: 0.8 },
    { dx: -202, dy: 246, width: 238, height: 196, opacity: 0.65 },
    { dx: 224, dy: 240, width: 238, height: 196, opacity: 0.65 },
    { dx: 0, dy: 285, width: 314, height: 208, opacity: 0.6 },
];

const LIGHT_GRADIENT =
    "radial-gradient(closest-side, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 50%, transparent 100%)";

const LIGHT_PATCHES: GlowBlob[] = [
    { dx: 200, dy: -140, width: 220, height: 150, opacity: 0.25 },
    { dx: -110, dy: -35, width: 180, height: 140, opacity: 0.15 },
];

const PARALLAX_SPRING = { stiffness: 60, damping: 20 };

export default function WaitlistHero() {
    const reduceMotion = useReducedMotion() ?? false;
    const [phase, setPhase] = useState<HeroPhase>("intro");
    const pointerX = useMotionValue(0);
    const pointerY = useMotionValue(0);
    const parallaxX = useSpring(pointerX, PARALLAX_SPRING);
    const parallaxY = useSpring(pointerY, PARALLAX_SPRING);

    const heroMotion: HeroMotion = {
        phase: reduceMotion && phase === "intro" ? "idle" : phase,
        reduceMotion,
        parallaxX,
        parallaxY,
    };

    const trackPointer = (event: PointerEvent<HTMLElement>) => {
        if (reduceMotion) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        pointerX.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1);
        pointerY.set(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
    };

    const releasePointer = () => {
        pointerX.set(0);
        pointerY.set(0);
    };

    return (
        <section
            onPointerMove={trackPointer}
            onPointerLeave={releasePointer}
            className="relative min-h-screen w-full overflow-hidden bg-white text-white"
        >
            <div className="absolute inset-0">
                <WaitlistHeroGlow
                    blobs={GLOW_BLOBS}
                    gradient={BLOB_GRADIENT}
                    blur={35}
                    depth={-14}
                    heroMotion={heroMotion}
                />
                <WaitlistHeroGlow
                    blobs={LIGHT_PATCHES}
                    gradient={LIGHT_GRADIENT}
                    blur={40}
                    depth={-10}
                    heroMotion={heroMotion}
                />
                <WaitlistHeroBrandMark color={BLUE} heroMotion={heroMotion} />

                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                    <WaitlistHeroTile heroMotion={heroMotion} />
                    <WaitlistHeroHeadline heroMotion={heroMotion} />
                    <WaitlistJoinForm
                        heroMotion={heroMotion}
                        onIntroComplete={() => setPhase("idle")}
                    />
                </div>
            </div>
        </section>
    );
}
