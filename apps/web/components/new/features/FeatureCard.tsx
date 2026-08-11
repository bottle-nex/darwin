"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Feature } from "@/types/feature.type";
import FeatureDetail from "./FeatureDetail";
import FeatureTeaser from "./FeatureTeaser";
import { OPEN_GROW } from "./cardMetrics";

/**
 * One feature card, which springs open on hover.
 *
 * Both faces stay mounted and crossfade, and each is laid out at its own fixed
 * width (DETAIL_WIDTH / TEASER_WIDTH) rather than filling the card. That is what
 * keeps the copy from stretching or rewrapping mid-animation: the card's edges
 * move, the content inside does not. The widths are chosen to match what the
 * flex row settles at, so the overflow being clipped is never visible.
 */

/**
 * `bounce` is the overshoot and `visualDuration` how long it looks like it takes
 * to arrive — far easier to tune by feel than raw stiffness and damping.
 */
const EXPAND_SPRING = { type: "spring" as const, visualDuration: 0.45, bounce: 0.36 };

/** The arriving content rises with slightly less bounce, so it reads as settling
 *  into the card rather than competing with it. */
const RISE_SPRING = { type: "spring" as const, visualDuration: 0.4, bounce: 0.26 };

/** Departing copy only fades, and fast, so the two faces never overlap visibly. */
const FADE_OUT = { duration: 0.16, ease: "easeOut" as const };

/** A bouncy colour ramp looks like a mistake, so this one stays a plain tween. */
const COLOR_TWEEN = { duration: 0.25, ease: "easeOut" as const };

/** How far below its resting place the arriving content starts. */
const RISE_DISTANCE = 30;

/** Collapsed cards sit slightly inset, which lifts the open one out of the row. */
const COLLAPSED_INSET = 12;

type FeatureCardProps = {
    feature: Feature;
    index: number;
    isOpen: boolean;
    onOpen: () => void;
};

export default function FeatureCard({ feature, index, isOpen, onOpen }: FeatureCardProps) {
    return (
        <motion.button
            type="button"
            aria-expanded={isOpen}
            onMouseEnter={onOpen}
            // Hover is the intended trigger; focus keeps it reachable by keyboard,
            // and click covers touch, where hover never fires at all.
            onFocus={onOpen}
            onClick={onOpen}
            initial={false}
            animate={{
                flexGrow: isOpen ? OPEN_GROW : 1,
                backgroundColor: isOpen ? "#ffffff" : "#EFEDE6",
                marginTop: isOpen ? 0 : COLLAPSED_INSET,
                marginBottom: isOpen ? 0 : COLLAPSED_INSET,
            }}
            transition={{ ...EXPAND_SPRING, backgroundColor: COLOR_TWEEN }}
            className={cn(
                "relative basis-0 overflow-hidden rounded-3xl text-left",
                isOpen ? "shadow-sm shadow-black/5" : "cursor-pointer",
            )}
        >
            {/* Each face rises into place and only fades on the way out. The card's
                overflow-hidden is what makes the arriving content read as coming up
                from the bottom edge rather than just sliding around inside. */}
            <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : RISE_DISTANCE }}
                transition={isOpen ? RISE_SPRING : FADE_OUT}
            >
                <FeatureDetail feature={feature} />
            </motion.div>

            <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: isOpen ? 0 : 1, y: isOpen ? -RISE_DISTANCE : 0 }}
                transition={isOpen ? FADE_OUT : RISE_SPRING}
            >
                <FeatureTeaser feature={feature} index={index} />
            </motion.div>
        </motion.button>
    );
}
