/**
 * Shared motion vocabulary for the landing diagrams. Every animated element in a
 * diagram declares one of these variants and nothing else — the scene's root
 * `motion` element owns the trigger, and the variants propagate down to it.
 */

/** Scale variants need the element's own bbox as the origin, not the viewBox's. */
export const POP_ORIGIN = "origin-center [transform-box:fill-box]";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Labels, dotted guides and anything that should simply appear. */
export function fade(delay: number) {
    return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { delay, duration: 0.5 } },
    };
}

/** Nodes, dots and board marks — they spring in rather than materialise. */
export function pop(delay: number) {
    return {
        hidden: { opacity: 0, scale: 0.4 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { delay, type: "spring" as const, bounce: 0.35, duration: 0.6 },
        },
    };
}

/** Lines and traces, drawn from their start point to their end point. */
export function draw(delay: number, duration: number) {
    return {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                pathLength: { delay, duration, ease: "easeInOut" as const },
                opacity: { delay, duration: 0.01 },
            },
        },
    };
}

/** Objects that fall into place from above, e.g. the integration keycaps. */
export function drop(delay: number, duration: number) {
    return {
        hidden: { opacity: 0, y: -48 },
        visible: { opacity: 1, y: 0, transition: { delay, duration, ease: EASE_OUT } },
    };
}
