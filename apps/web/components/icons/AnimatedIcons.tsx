"use client";
import { motion, useReducedMotion, type Transition, type Variants } from "motion/react";

export type AnimatedIcon = (props: { className?: string }) => React.ReactElement;

const SPRING: Transition = { type: "spring", stiffness: 420, damping: 24, mass: 0.6 };

function useStagger() {
    const reduceMotion = useReducedMotion();
    return (delay: number): Transition =>
        reduceMotion ? { duration: 0 } : { ...SPRING, delay: delay };
}

const REST_HOVER = (hover: Variants["hover"]): Variants => ({ rest: {}, hover: hover });

export const PeopleIcon: AnimatedIcon = ({ className }) => {
    const at = useStagger();

    return (
        <motion.svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <motion.g opacity={0.55} variants={REST_HOVER({ x: -1.6, y: -0.9 })} transition={at(0)}>
                <circle cx="5.2" cy="9.6" r="2.5" />
                <path d="M5.2 13.4c-2.5 0-4.55 1.7-4.7 3.85-.05.66.47 1.25 1.13 1.25h7.14c.66 0 1.18-.59 1.13-1.25-.15-2.15-2.2-3.85-4.7-3.85Z" />
            </motion.g>

            <motion.g
                opacity={0.55}
                variants={REST_HOVER({ x: 1.6, y: -0.9 })}
                transition={at(0.05)}
            >
                <circle cx="18.8" cy="9.6" r="2.5" />
                <path d="M18.8 13.4c2.5 0 4.55 1.7 4.7 3.85.05.66-.47 1.25-1.13 1.25h-7.14c-.66 0-1.18-.59-1.13-1.25.15-2.15 2.2-3.85 4.7-3.85Z" />
            </motion.g>

            <motion.g
                variants={REST_HOVER({ y: -0.6, scale: 1.06 })}
                transition={at(0.09)}
                style={{ transformOrigin: "12px 13px" }}
            >
                <circle cx="12" cy="7.9" r="3.2" />
                <path d="M12 12.8c-3.3 0-6 2.15-6.2 4.95-.05.7.5 1.3 1.2 1.3h10c.7 0 1.25-.6 1.2-1.3-.2-2.8-2.9-4.95-6.2-4.95Z" />
            </motion.g>
        </motion.svg>
    );
};

export const NoteIcon: AnimatedIcon = ({ className }) => {
    const at = useStagger();

    return (
        <motion.svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <motion.path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5 5.6h7a2.6 2.6 0 0 1 2.6 2.6V19a2.6 2.6 0 0 1-2.6 2.6H5A2.6 2.6 0 0 1 2.4 19V8.2A2.6 2.6 0 0 1 5 5.6ZM5.9 9.4h5.2a.8.8 0 0 1 0 1.6H5.9a.8.8 0 0 1 0-1.6ZM5.9 13h5.2a.8.8 0 0 1 0 1.6H5.9a.8.8 0 0 1 0-1.6ZM5.9 16.6h3.1a.8.8 0 0 1 0 1.6H5.9a.8.8 0 0 1 0-1.6Z"
                variants={REST_HOVER({ rotate: -3 })}
                transition={at(0)}
                style={{ transformOrigin: "8.5px 13.5px" }}
            />

            <g transform="rotate(35 18.5 7.2)">
                <motion.g variants={REST_HOVER({ y: 1.7 })} transition={at(0.06)}>
                    <path d="M18.5 1.9c-.86 0-1.55.7-1.55 1.55V8.8h3.1V3.45c0-.86-.7-1.55-1.55-1.55Z" />
                    <path d="M16.95 9.6h3.1L18.5 12.6 16.95 9.6Z" />
                </motion.g>
            </g>
        </motion.svg>
    );
};

export const ChecklistIcon: AnimatedIcon = ({ className }) => {
    const at = useStagger();
    const rows = [
        { y: 4.6, width: 13.6, origin: "3.9px 6.3px" },
        { y: 10.3, width: 9.6, origin: "3.9px 12px" },
        { y: 16, width: 12.2, origin: "3.9px 17.7px" },
    ];

    return (
        <motion.svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            {rows.map((row, index) => (
                <motion.g
                    key={row.y}
                    variants={REST_HOVER({ x: 1.6 })}
                    transition={at(index * 0.06)}
                >
                    <motion.rect
                        x="2.2"
                        y={row.y}
                        width="3.4"
                        height="3.4"
                        rx="1.1"
                        variants={REST_HOVER({ scale: 1.18 })}
                        transition={at(index * 0.06 + 0.03)}
                        style={{ transformOrigin: row.origin }}
                    />
                    <rect x="8.2" y={row.y + 0.9} width={row.width} height="1.6" rx="0.8" />
                </motion.g>
            ))}
        </motion.svg>
    );
};

export const BriefcaseIcon: AnimatedIcon = ({ className }) => {
    const at = useStagger();

    return (
        <motion.svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <motion.path
                d="M9.4 7.9V6c0-.72.58-1.3 1.3-1.3h2.6c.72 0 1.3.58 1.3 1.3v1.9h2V6a3.3 3.3 0 0 0-3.3-3.3h-2.6A3.3 3.3 0 0 0 7.4 6v1.9h2Z"
                variants={REST_HOVER({ y: -1.2 })}
                transition={at(0)}
            />

            <motion.path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.6 7.9h14.8a3.1 3.1 0 0 1 3.1 3.1v6.6a3.1 3.1 0 0 1-3.1 3.1H4.6a3.1 3.1 0 0 1-3.1-3.1V11a3.1 3.1 0 0 1 3.1-3.1ZM10.9 12.9h2.2a1 1 0 0 1 1 1v1.2a1 1 0 0 1-1 1h-2.2a1 1 0 0 1-1-1v-1.2a1 1 0 0 1 1-1Z"
                variants={REST_HOVER({ y: 0.5, scaleX: 1.03 })}
                transition={at(0.06)}
                style={{ transformOrigin: "12px 20px" }}
            />
        </motion.svg>
    );
};
