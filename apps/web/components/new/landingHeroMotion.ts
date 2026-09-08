const ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;

export const MOCK_FADE = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.8, ease: ENTRANCE_EASE, delay: 1.8 } },
};

export const CARD_STACK = {
    hidden: {},
    show: { transition: { staggerChildren: 0.14, delayChildren: 2.1 } },
};

export const CARD_RISE = {
    hidden: { opacity: 0, x: 28, filter: "blur(6px)" },
    show: {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        transition: { duration: 0.55, ease: ENTRANCE_EASE },
    },
};

export const HERO_COPY = {
    hidden: {},
    show: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
};

export const HERO_BADGE = {
    hidden: { opacity: 0, y: 10, filter: "blur(10px)" },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.7, ease: ENTRANCE_EASE },
    },
};

export const HERO_HEADLINE = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
};

export const HERO_WORD = {
    hidden: { opacity: 0, y: "0.5em", filter: "blur(14px)" },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.85, ease: ENTRANCE_EASE },
    },
};

export const HERO_BODY = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.8, ease: ENTRANCE_EASE },
    },
};

export const HERO_ACTIONS = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09 } },
};

export const HERO_ACTION = {
    hidden: { opacity: 0, y: 12, filter: "blur(8px)" },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.6, ease: ENTRANCE_EASE },
    },
};

function aside(offset: { x?: number; y?: number }, delay: number) {
    return {
        hidden: { opacity: 0, filter: "blur(10px)", ...offset },
        show: {
            opacity: 1,
            x: 0,
            y: 0,
            filter: "blur(0px)",
            transition: { duration: 0.95, ease: ENTRANCE_EASE, delay },
        },
    };
}

export const HERO_ASIDE_LEFT = aside({ x: -48 }, 0.75);

export const HERO_ASIDE_BOTTOM_LEFT = aside({ y: 44 }, 0.95);

export const HERO_ASIDE_RIGHT = aside({ x: 48 }, 1.1);
