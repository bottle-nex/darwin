"use client";

import { EnterArrowIcon } from "@trymatcha/ui/icons";
import { AnimatePresence, motion } from "motion/react";
import { type KeyboardEvent, useState } from "react";

import {
    EASE_OUT_EXPO,
    type HeroMotion,
    INTRO_AT,
} from "@/components/join-waitlist/waitlistHeroMotion";

const SHELL_GLASS =
    "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.3) 55%, rgba(255,255,255,0.22) 100%)";

const MORPH_SPRING = { type: "spring", stiffness: 380, damping: 32, mass: 0.8 } as const;
const SWAP_FADE = { duration: 0.18, ease: EASE_OUT_EXPO };

const ARROW_VARIANTS = { rest: { x: 0, y: 0 }, hover: { x: 2, y: 2 } };

type Props = { heroMotion: HeroMotion; onIntroComplete: () => void };

export default function WaitlistJoinForm({ heroMotion, onIntroComplete }: Props) {
    const { phase, reduceMotion } = heroMotion;
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");

    const closeOnEscape = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Escape") setOpen(false);
    };

    const closeWhenEmpty = () => {
        if (!email) setOpen(false);
    };

    return (
        <motion.div
            layout
            style={{ background: SHELL_GLASS }}
            initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.6,
                ease: EASE_OUT_EXPO,
                delay: INTRO_AT.button,
                layout: reduceMotion ? { duration: 0.2 } : MORPH_SPRING,
            }}
            onAnimationComplete={() => {
                if (phase === "intro") onIntroComplete();
            }}
            className="mt-[34px] flex h-9 items-center overflow-hidden rounded-full text-[15px] leading-none backdrop-blur-md shadow-[0_6px_16px_rgba(20,60,200,0.18),inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(20,60,200,0.18),inset_0_0_14px_rgba(255,255,255,0.35)]"
        >
            <AnimatePresence mode="popLayout" initial={false}>
                {open ? (
                    <motion.form
                        key="form"
                        layout
                        onSubmit={(event) => event.preventDefault()}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={SWAP_FADE}
                        className="flex h-full items-center gap-2 pl-4 pr-1"
                    >
                        <input
                            autoFocus
                            type="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            onKeyDown={closeOnEscape}
                            onBlur={closeWhenEmpty}
                            placeholder="you@company.com"
                            aria-label="Email address"
                            className="w-[196px] bg-transparent text-white outline-none placeholder:text-white/65"
                        />
                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.94 }}
                            className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/30 transition-[filter] hover:brightness-115 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!email}
                        >
                            <EnterArrowIcon className="size-3 rotate-180" />
                        </motion.button>
                    </motion.form>
                ) : (
                    <motion.button
                        key="cta"
                        layout
                        type="button"
                        onClick={() => setOpen(true)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={SWAP_FADE}
                        whileHover="hover"
                        whileTap={{ scale: 0.96 }}
                        className="flex h-full cursor-pointer items-center px-4 transition-[filter] hover:brightness-110"
                    >
                        Join waitlist
                        <motion.span
                            variants={ARROW_VARIANTS}
                            initial="rest"
                            animate="rest"
                            className="ml-2 inline-flex"
                        >
                            <EnterArrowIcon className="size-3 rotate-[225deg]" />
                        </motion.span>
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
