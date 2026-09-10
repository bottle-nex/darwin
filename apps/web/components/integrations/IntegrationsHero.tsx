"use client";

import { motion, type Variants } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { landingContainer } from "@/components/landing/LandingSection";
import { AppLogo } from "@/components/logo/AppLogo";
import { cn } from "@/lib/utils";

const CARD_SPACING = 40;

const PANEL_TILT =
    "overflow-hidden rounded-md [transform:perspective(1000px)_rotateY(45deg)] [transform-origin:left_center] [backface-visibility:hidden] shadow-[0_26px_60px_-32px_rgba(24,24,27,0.45)]";

type HeroCard = {
    name: string;
    left: string;
    logoSrc?: string;
    logoClassName?: string;
    className?: string;
};

const HERO_CARDS: HeroCard[] = [
    {
        name: "Jira",
        logoSrc: "/images/integrations/jira.svg",
        left: "left-0",
    },
    {
        name: "Trello",
        logoSrc: "/images/integrations/trello.svg",
        logoClassName: "scale-90",
        left: "left-[40px]",
    },
    {
        name: "GitHub",
        logoSrc: "/images/integrations/github.svg",
        left: "left-[80px]",
    },
    {
        name: "Slack",
        logoSrc: "/images/integrations/slack.svg",
        logoClassName: "scale-200",
        left: "left-[120px]",
    },
    {
        name: "Linear",
        logoSrc: "/images/integrations/linear.svg",
        left: "left-[160px]",
    },
    {
        name: "darwin",
        left: "left-[200px]",
        className: "transition-opacity duration-300",
    },
];

type SpringConfig = {
    type: "spring";
    bounce?: number;
    visualDuration?: number;
    stiffness?: number;
    damping?: number;
    mass?: number;
};

const defaultSpring: SpringConfig = {
    type: "spring",
    visualDuration: 0.5,
    bounce: 0.2,
};

export interface IntegrationsHeroProps {
    spring?: SpringConfig;
    shiftDistance?: number;
    swapDuration?: number;
    entranceStagger?: number;
}

export const IntegrationsHero = ({
    spring = defaultSpring,
    shiftDistance = 80,
    swapDuration = 0.5,
    entranceStagger = 0.2,
}: IntegrationsHeroProps = {}) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const swapStyle = { transitionDuration: `${swapDuration}s` };

    const containerVariants: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: entranceStagger,
                staggerDirection: -1,
            },
        },
    };

    const cardVariants: Variants = {
        hidden: (offset: number) => ({ x: offset }),
        visible: { x: 0, transition: spring },
    };

    const textContainer: Variants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
    };

    const textItem: Variants = {
        hidden: { opacity: 0, y: 12 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
        },
    };

    return (
        <section className="relative min-h-dvh w-full overflow-hidden bg-ink">
            <div className={cn(landingContainer, "relative min-h-dvh")}>
                <div className="absolute top-1/2 right-0 hidden -translate-y-1/2 lg:block">
                    <motion.div
                        className="relative flex h-144 w-[500px] translate-x-16 mask-b-from-10%"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {HERO_CARDS.map((card, index) => {
                            const shouldShift = activeIndex !== null && index > activeIndex;
                            const entranceOffset = -index * CARD_SPACING;
                            return (
                                <motion.div
                                    key={card.name}
                                    className={`group absolute -bottom-2 ${card.left} z-20 h-144 w-72 cursor-pointer ${card.className ?? ""}`}
                                    variants={cardVariants}
                                    custom={entranceOffset}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onMouseLeave={() => setActiveIndex(null)}
                                    onClick={() =>
                                        setActiveIndex((current) =>
                                            current === index ? null : index,
                                        )
                                    }
                                >
                                    <motion.div
                                        className="relative h-full w-full"
                                        animate={{ x: shouldShift ? shiftDistance : 0 }}
                                        transition={spring}
                                    >
                                        <div className={cn("relative h-full w-full", PANEL_TILT)}>
                                            {card.logoSrc ? (
                                                <div className="flex h-full w-full items-center justify-center bg-neutral-100">
                                                    <div
                                                        style={swapStyle}
                                                        className={cn(
                                                            "absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_50%,rgba(124,92,230,0.16),transparent_75%)] opacity-0 transition-opacity group-hover:opacity-100",
                                                            activeIndex === index && "opacity-100",
                                                        )}
                                                    />
                                                    <Image
                                                        src={card.logoSrc}
                                                        alt={card.name}
                                                        width={64}
                                                        height={64}
                                                        style={swapStyle}
                                                        className={cn(
                                                            "relative size-24 opacity-0 transition-opacity group-hover:opacity-100",
                                                            activeIndex === index &&
                                                                "scale-100 opacity-100",
                                                            card.logoClassName,
                                                        )}
                                                    />
                                                    <div className="absolute inset-y-0 left-0 w-px bg-edge" />
                                                </div>
                                            ) : (
                                                <div className="relative h-full w-full">
                                                    <div className="absolute inset-0 bg-neutral-100" />
                                                    <div className="absolute inset-0 bg-[radial-gradient(90%_65%_at_50%_70%,rgba(124,92,230,0.42),rgba(124,92,230,0.14)_50%,transparent_80%)]" />
                                                    <div className="absolute inset-0 bg-[radial-gradient(70%_40%_at_50%_-10%,rgba(124,92,230,0.16),transparent_70%)]" />
                                                    <AppLogo className="absolute top-1/2 left-1/2 h-auto w-28 -translate-x-1/2 -translate-y-1/2 text-foreground" />
                                                    <div className="absolute inset-y-0 left-0 w-px bg-edge" />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>

                <motion.div
                    variants={textContainer}
                    initial="hidden"
                    animate="visible"
                    className="absolute bottom-20 left-0 max-w-3xl"
                >
                    <motion.h1
                        variants={textItem}
                        className="font-headline mt-9 max-w-4xl text-[2.5rem] leading-tight tracking-tight"
                    >
                        <span className="font-headline font-medium text-foreground">
                            The tools your team.{" "}
                        </span>
                        <span className="font-pixel text-muted-foreground/70">
                            Already wired in.
                        </span>
                    </motion.h1>

                    <motion.p
                        variants={textItem}
                        className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
                    >
                        Issues flow in from GitHub, Slack, Linear, and Trello. Verified pull
                        requests flow back out — without anyone picking up the ticket.
                    </motion.p>
                    <motion.div variants={textItem} className="flex items-center gap-3 mt-5">
                        <Link
                            href="/login"
                            className="inline-flex h-11 items-center rounded-lg bg-linear-to-b from-[#2b2b2b] via-[#2b2b2b] to-neutral-700 px-5 text-sm font-medium text-snow shadow-[0_3px_0_0_#151516,0_8px_16px_-6px_rgba(24,24,27,0.35)] transition-all duration-150 hover:bg-[#343435] active:translate-y-[2px] active:shadow-[0_1px_0_0_#151516,0_3px_6px_-4px_rgba(24,24,27,0.35)]"
                        >
                            Get started
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex h-11 items-center rounded-lg border border-edge bg-snow px-5 text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(24,24,27,0.05)] transition-colors hover:bg-mist"
                        >
                            Browse integrations
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default IntegrationsHero;
