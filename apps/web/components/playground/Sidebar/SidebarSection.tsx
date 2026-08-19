"use client";

import { Button } from "@/components/ui/button";
import { Children, useState } from "react";
import { motion, type Variants } from "motion/react";
import { FaCaretDown, FaCaretRight } from "react-icons/fa";
import { cn } from "@/lib/utils";

const HEIGHT_SPRING = { type: "spring", stiffness: 800, damping: 48, mass: 0.6 } as const;

const CONTAINER_VARIANTS: Variants = {
    open: {
        height: "auto",
        transition: { ...HEIGHT_SPRING, staggerChildren: 0.018 },
    },
    closed: {
        height: 0,
        transition: { ...HEIGHT_SPRING, staggerChildren: 0.01, staggerDirection: -1 },
    },
};

const ROW_VARIANTS: Variants = {
    open: { opacity: 1, y: 0, transition: { duration: 0.13, ease: [0.4, 0, 0.2, 1] } },
    closed: { opacity: 0, y: -4, transition: { duration: 0.08, ease: [0.4, 0, 0.2, 1] } },
};

type SectionProps = {
    title: string;
    action?: React.ReactNode;
    defaultOpen?: boolean;
    variant?: "header" | "inline";
    children: React.ReactNode;
};

export default function PlaygroundSidebarSection({
    title,
    action,
    defaultOpen = true,
    variant = "header",
    children,
}: SectionProps) {
    const [open, setOpen] = useState(defaultOpen);
    const Chevron = open ? FaCaretDown : FaCaretRight;

    return (
        <section className="flex flex-col">
            <div className="flex items-center justify-between gap-1 pr-1">
                <Button
                    variant="unstyled"
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className={cn(
                        "group flex flex-1 cursor-pointer items-center gap-x-2 rounded-md py-1.5 text-left ring-inset focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden",
                        variant === "header"
                            ? "px-2 text-[12px] font-medium text-neutral-500 capitalize"
                            : "px-2 text-[12px] font-medium text-neutral-400",
                    )}
                >
                    <span>{title}</span>
                    <Chevron className="size-3 text-neutral-500" aria-hidden />
                </Button>
                {action && <span className="flex items-center">{action}</span>}
            </div>

            <motion.div
                initial={false}
                animate={open ? "open" : "closed"}
                variants={CONTAINER_VARIANTS}
                className="flex flex-col gap-0.5 overflow-hidden"
                aria-hidden={!open}
            >
                {Children.map(children, (child) => (
                    <motion.div variants={ROW_VARIANTS}>{child}</motion.div>
                ))}
            </motion.div>
        </section>
    );
}
