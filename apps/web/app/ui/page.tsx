"use client";
import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export default function UIPage() {
    const [selectedCard, setSelectedCard] = useState(0);
    const [direction, setDirection] = useState(1);
    const reduceMotion = useReducedMotion();

    const data = [
        {
            title: "Repo aware",
            img: "/images/why/card1.svg",
        },
        {
            title: "Fully autonomous",
            img: "/images/why/card2.svg",
        },
        {
            title: "Human reviewed",
            img: "/images/why/card3.svg",
        },
    ];

    const select = (index: number) => {
        setSelectedCard((curr) => {
            if (index !== curr) setDirection(index > curr ? 1 : -1);
            return index;
        });
    };

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center">
            <div className="h-full w-xl border-r border-l flex flex-col justify-center">
                <p className="text-2xl px-6 mb-6">What sets us apart</p>
                <div>
                    <div className="flex">
                        <div className="w-60 pl-6">
                            {data.map((item, index) => (
                                <div
                                    key={item.title}
                                    className={cn(
                                        "relative flex items-start border-b p-5 transition-colors cursor-pointer",
                                        selectedCard === index
                                            ? "text-neutral-900"
                                            : "text-neutral-400",
                                    )}
                                    onMouseEnter={() => select(index)}
                                >
                                    {selectedCard === index && (
                                        <motion.div
                                            layoutId="active-bar"
                                            className="absolute -left-6 top-0 h-full w-1 rounded-xs bg-neutral-900"
                                            transition={
                                                reduceMotion
                                                    ? { duration: 0 }
                                                    : { type: "spring", stiffness: 500, damping: 40 }
                                            }
                                        />
                                    )}
                                    <p className="text-xs pr-1">
                                        { '(' + String(index + 1).padStart(2, "0") + ')'}
                                    </p>
                                    <div className="text-xl whitespace-pre-line"> {item.title}</div>
                                </div>
                            ))}
                        </div>
                        <div className="relative mx-6 flex-1 overflow-hidden rounded-sm border">
                            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                                <motion.div
                                    key={selectedCard}
                                    custom={direction}
                                    className="absolute inset-0"
                                    variants={{
                                        enter: (d: number) => ({
                                            y: reduceMotion ? 0 : d > 0 ? "100%" : "-100%",
                                            opacity: 0,
                                        }),
                                        center: { y: 0, opacity: 1 },
                                        exit: (d: number) => ({
                                            y: reduceMotion ? 0 : d > 0 ? "-100%" : "100%",
                                            opacity: 0,
                                        }),
                                    }}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={
                                        reduceMotion
                                            ? { duration: 0.15 }
                                            : { type: "spring", stiffness: 400, damping: 40 }
                                    }
                                >
                                    <Image
                                        src={data[selectedCard].img}
                                        alt={data[selectedCard].title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 320px"
                                        className="object-cover"
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
