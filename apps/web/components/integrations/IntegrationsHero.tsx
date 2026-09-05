"use client";

import { motion, type Variants } from "motion/react";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

const CARD_SPACING = 40;

const PANEL_TILT =
    "overflow-hidden rounded-md [transform:perspective(1000px)_rotateY(45deg)] [transform-origin:left_center] [backface-visibility:hidden]";

type HeroCard = {
    activeSrc: string;
    left: string;
    showIdleSwap?: boolean;
    className?: string;
};

const HERO_CARDS: HeroCard[] = [
    {
        activeSrc: "/images/integrations/test.png",
        left: "left-[40px]",
    },
    {
        activeSrc: "/images/integrations/test.png",
        left: "left-[80px]",
    },
    {
        activeSrc: "/images/integrations/test.png",
        left: "left-[120px]",
    },
    {
        activeSrc: "/images/integrations/test.png",
        left: "left-[160px]",
    },
    {
        activeSrc: "https://assets.aceternity.com/labs/4.webp",
        left: "left-[200px]",
        showIdleSwap: false,
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
    shiftDistance = 60,
    swapDuration = 0.5,
    entranceStagger = 0.2,
}: IntegrationsHeroProps = {}) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const isHovered = activeIndex !== null;
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

    return (
        <div className="flex h-dvh w-full items-center justify-center bg-black pl-10">
            <div>
                <motion.h1
                    key="solid"
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: isHovered ? 1 : 0,
                    }}
                    className={cn(
                        "absolute top-1/2 left-1/2 z-50 mx-auto w-fit -translate-x-1/2 -translate-y-1/2 text-center text-xl font-bold tracking-tight whitespace-nowrap md:text-5xl",
                        "bg-clip-text py-4 text-transparent transition-all duration-500",
                        "bg-[linear-gradient(to_right,white_0%,rgba(255,255,255,0)_30%,rgba(255,255,255,0)_60%,rgba(255,255,255,0.2)_80%,white_100%)]",
                    )}
                >
                    The tools your team already lives in.
                </motion.h1>
                <motion.h1
                    key="gradient"
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: isHovered ? 0 : 1,
                    }}
                    className={cn(
                        "absolute top-1/2 left-1/2 z-50 mx-auto w-fit -translate-x-1/2 -translate-y-1/2 text-center text-xl font-bold tracking-tight whitespace-nowrap md:text-5xl",
                        "bg-clip-text py-4 text-transparent transition-all duration-500",
                        "bg-[linear-gradient(to_right,white,white)]",
                    )}
                >
                    The tools your team already lives in.
                </motion.h1>
                <motion.div
                    className="relative flex h-144 w-[500px] mask-b-from-10%"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className={cn("absolute inset-y-0 left-0 h-144 w-72", PANEL_TILT)}>
                        <Image
                            src="https://assets.aceternity.com/labs/main.webp"
                            alt="Hero"
                            width={1000}
                            height={1000}
                            className="h-full w-full object-cover"
                        />
                    </div>

                    {HERO_CARDS.map((card, index) => {
                        const shouldShift = activeIndex !== null && index > activeIndex;
                        const isActive = activeIndex === index;
                        const entranceOffset = -index * CARD_SPACING;
                        return (
                            <motion.div
                                key={card.activeSrc}
                                className={`group absolute -bottom-2 ${card.left} z-20 h-144 w-72 cursor-pointer ${card.className ?? ""}`}
                                variants={cardVariants}
                                custom={entranceOffset}
                                onMouseEnter={() => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(null)}
                                onClick={() =>
                                    setActiveIndex((current) => (current === index ? null : index))
                                }
                            >
                                <motion.div
                                    className="relative h-full w-full"
                                    animate={{ x: shouldShift ? shiftDistance : 0 }}
                                    transition={spring}
                                >
                                    <div className={cn("relative h-full w-full", PANEL_TILT)}>
                                        {card.showIdleSwap !== false ? (
                                            <>
                                                <Image
                                                    src={card.activeSrc}
                                                    alt="Hero"
                                                    width={1000}
                                                    height={1000}
                                                    style={swapStyle}
                                                    className={cn(
                                                        "absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity group-hover:opacity-100",
                                                        isActive && "opacity-100",
                                                    )}
                                                />
                                                <Image
                                                    src="https://assets.aceternity.com/labs/idle.webp"
                                                    alt="Hero idle"
                                                    width={1000}
                                                    height={1000}
                                                    style={swapStyle}
                                                    className={cn(
                                                        "absolute inset-0 h-full w-full object-cover opacity-100 transition-opacity group-hover:opacity-0",
                                                        isActive && "opacity-0",
                                                    )}
                                                />
                                                <div className="absolute top-8 left-2 z-50 h-full w-4 bg-black blur-md" />
                                            </>
                                        ) : (
                                            <Image
                                                src={card.activeSrc}
                                                alt="Hero"
                                                width={1000}
                                                height={1000}
                                                style={swapStyle}
                                                className="absolute inset-0 h-full w-full object-cover transition-opacity"
                                            />
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
};

export default IntegrationsHero;
