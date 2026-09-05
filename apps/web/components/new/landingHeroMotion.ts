const ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;

export const GRAIN_FADE = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 1.1, ease: ENTRANCE_EASE, delay: 1.9 } },
};

export const FRAME_FADE = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.8, ease: ENTRANCE_EASE, delay: 1.5 } },
};

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

export const HEADLINE_GROUP = {
    hidden: {},
    show: {},
};

export const HEADLINE_LINE = {
    hidden: { opacity: 0, y: "0.55em", filter: "blur(14px)" },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.9, ease: ENTRANCE_EASE },
    },
};

export const HEADLINE_BODY = {
    hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.9, ease: ENTRANCE_EASE, delay: 0.7 },
    },
};
