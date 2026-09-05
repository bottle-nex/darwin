"use client";

import { motion, useTransform } from "motion/react";

import {
    EASE_OUT_EXPO,
    type HeroMotion,
    INTRO_AT,
} from "@/components/join-waitlist/waitlistHeroMotion";

type Token = { text: string; italic?: boolean } | "star" | "break";

const HEADLINE: Token[] = [
    { text: "We", italic: true },
    { text: "engineer", italic: true },
    "star",
    { text: "pull" },
    { text: "requests" },
    { text: "that" },
    { text: "feel" },
    "break",
    { text: "thoughtful," },
    { text: "tested," },
    { text: "and" },
    { text: "unmistakably" },
    { text: "yours." },
];

const WORD_STAGGER = 0.045;
const TEXT_DEPTH = 3;

const STAR_SPRING = { type: "spring", stiffness: 300, damping: 18 } as const;

type Props = { heroMotion: HeroMotion };

export default function WaitlistHeroHeadline({ heroMotion }: Props) {
    const x = useTransform(heroMotion.parallaxX, (value) => value * TEXT_DEPTH);
    const y = useTransform(heroMotion.parallaxY, (value) => value * TEXT_DEPTH);
    let slot = 0;

    return (
        <motion.p
            style={{ x, y }}
            className="mt-9 whitespace-nowrap text-center text-[26px] leading-[32px] tracking-[-0.01em] font-headline"
        >
            {HEADLINE.map((token, index) => {
                if (token === "break") return <br key={index} />;
                const currentSlot = slot++;
                return token === "star" ? (
                    <Star key={index} slot={currentSlot} heroMotion={heroMotion} />
                ) : (
                    <Word key={index} slot={currentSlot} heroMotion={heroMotion} {...token} />
                );
            })}
        </motion.p>
    );
}

function Word({
    text,
    italic,
    slot,
    heroMotion,
}: {
    text: string;
    italic?: boolean;
    slot: number;
    heroMotion: HeroMotion;
}) {
    return (
        <>
            <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span
                    initial={
                        heroMotion.reduceMotion
                            ? false
                            : { y: "110%", opacity: 0, filter: "blur(6px)" }
                    }
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    transition={{
                        duration: 0.75,
                        ease: EASE_OUT_EXPO,
                        delay: INTRO_AT.headline + slot * WORD_STAGGER,
                    }}
                    className="inline-block"
                >
                    {italic ? <em>{text}</em> : text}
                </motion.span>
            </span>{" "}
        </>
    );
}

function Star({ slot, heroMotion }: { slot: number; heroMotion: HeroMotion }) {
    const { phase, reduceMotion } = heroMotion;
    const spinning = phase === "idle" && !reduceMotion;

    return (
        <>
            <motion.span
                initial={reduceMotion ? false : { scale: 0, rotate: -90, opacity: 0 }}
                animate={
                    spinning
                        ? { opacity: 1, scale: 1, rotate: [0, 360] }
                        : { opacity: 1, scale: 1, rotate: 0 }
                }
                transition={
                    spinning
                        ? { rotate: { duration: 24, repeat: Infinity, ease: "linear" } }
                        : { ...STAR_SPRING, delay: INTRO_AT.headline + slot * WORD_STAGGER }
                }
                className="mx-5 inline-block align-middle text-[12px]"
            >
                ✳
            </motion.span>{" "}
        </>
    );
}
