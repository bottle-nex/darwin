"use client";
import { useEffect, useState } from "react";
import {
    motion,
    AnimatePresence,
    MotionValue,
    useMotionValue,
    useSpring,
    useTransform,
    animate,
} from "motion/react";

function DigitWheel({
    source,
    multiplier,
    minValue,
    maxValue,
}: {
    source: MotionValue<number>;
    multiplier: number;
    minValue: number;
    maxValue: number;
}) {
    const minWheel = Math.floor(Math.min(minValue, maxValue) * multiplier);
    const maxWheel = Math.floor(Math.max(minValue, maxValue) * multiplier);
    const cellCount = maxWheel - minWheel + 1;

    const wheelInt = useTransform(source, (v) => Math.floor(v * multiplier));
    const wheelSmooth = useSpring(wheelInt, {
        stiffness: 260,
        damping: 28,
        mass: 0.8,
    });
    const transform = useTransform(
        wheelSmooth,
        (w) => `translateY(${(-(w - minWheel) * 100) / cellCount}%)`,
    );

    return (
        <span className="relative inline-block overflow-hidden h-[1em] leading-[1em] align-bottom">
            <span className="invisible">0</span>
            <motion.span
                className="absolute top-0 left-0 right-0 flex flex-col text-center"
                style={{ transform, height: `${cellCount}em` }}
            >
                {Array.from({ length: cellCount }, (_, i) => (
                    <span
                        key={i}
                        className="block overflow-hidden"
                        style={{ height: "1em", lineHeight: 1 }}
                    >
                        {(((minWheel + i) % 10) + 10) % 10}
                    </span>
                ))}
            </motion.span>
        </span>
    );
}

function AnimatedNumber({
    value,
    minValue = 11.99,
    maxValue = 14.99,
    duration = 1.0,
}: {
    value: number;
    minValue?: number;
    maxValue?: number;
    duration?: number;
}) {
    const mv = useMotionValue(value);

    useEffect(() => {
        const controls = animate(mv, value, {
            duration,
            ease: [0.32, 0.72, 0, 1],
        });
        return () => controls.stop();
    }, [value, mv, duration]);

    const range = { minValue, maxValue };

    return (
        <span className="inline-flex tabular-nums">
            <DigitWheel source={mv} multiplier={0.1} {...range} />
            <DigitWheel source={mv} multiplier={1} {...range} />
            <span>.</span>
            <DigitWheel source={mv} multiplier={10} {...range} />
            <DigitWheel source={mv} multiplier={100} {...range} />
        </span>
    );
}

export default function PricingProCard() {
    const [isYearly, setIsYearly] = useState<boolean>(true);

    const togglePlan = () => setIsYearly((prev) => !prev);

    const priceValue = isYearly ? 11.99 : 14.99;
    const subtitle = isYearly ? "$119.99 billed yearly" : "billed monthly";

    return (
        <div className="h-full w-1/2 bg-[#AB9FF2] rounded-4xl flex flex-col items-center justify-center px-12 gap-9 text-white">
            {/* Price block */}
            <div className="flex flex-col items-center gap-2 scale-105">
                <div className="font-serif text-7xl text-[#FAFAFE] tracking-tight leading-none tabular-nums">
                    $<AnimatedNumber value={priceValue} />
                    /mo
                </div>
                <div className="text-white/95 text-base font-medium h-5">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                            key={subtitle}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2 }}
                            className="inline-block"
                        >
                            {subtitle}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-4 text-white/95 text-base scale-105">
                <span className={isYearly ? "" : "text-white/60"}>Pay yearly</span>
                <button
                    type="button"
                    onClick={togglePlan}
                    className="relative w-14 h-7 rounded-full bg-[#0a0a0a]  cursor-pointer"
                    style={{
                        boxShadow:
                            "inset 0 3px 6px rgba(0,0,0,0.85), inset 0 1px 2px rgba(0,0,0,0.6), inset 0 -1px 1px rgba(255,255,255,0.08), 0 1px 1px rgba(255,255,255,0.12)",
                    }}
                    aria-label="Toggle billing period"
                >
                    <motion.div
                        className="absolute top-1 left-1 size-5 rounded-full"
                        style={{
                            background:
                                "radial-gradient(circle at 32% 28%, #ffffff 0%, #f5f5f5 45%, #d6d6d6 85%, #bdbdbd 100%)",
                            boxShadow:
                                "0 3px 6px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.4), inset 0 1.5px 1.5px rgba(255,255,255,1), inset 0 -2px 3px rgba(0,0,0,0.2), inset 0 0 0 0.5px rgba(0,0,0,0.08)",
                        }}
                        animate={{ x: isYearly ? 0 : 28 }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 28,
                        }}
                    />
                </button>
                <span className={isYearly ? "text-white/60" : ""}>monthly</span>
            </div>

            {/* Description */}
            <p className="text-white/90 text-center text-base max-w-sm leading-normal scale-105">
                No ads or hidden charges. We keep your data confidential, which keeps us focused on
                crafting the finest product for you.
            </p>
        </div>
    );
}
