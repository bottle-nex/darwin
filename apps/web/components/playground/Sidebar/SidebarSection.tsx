"use client";

import { DropdownCaretIcon, type IconType } from "@trydarwin/ui/icons";
import { motion, type Variants } from "motion/react";
import { Children, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import TreeBranch from "../Core/components/TreeBranch";

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
    icon?: IconType;
    action?: React.ReactNode;
    defaultOpen?: boolean;
    variant?: "header" | "inline" | "tree";
    children: React.ReactNode;
};

export default function PlaygroundSidebarSection({
    title,
    icon: Icon,
    action,
    defaultOpen = true,
    variant = "header",
    children,
}: SectionProps) {
    const [open, setOpen] = useState(defaultOpen);
    const isTree = variant === "tree";
    const rows = Children.toArray(children) as React.ReactElement[];

    return (
        <section className="flex flex-col">
            <div className={cn("flex items-center justify-between gap-1", action && "pr-1")}>
                <Button
                    variant="unstyled"
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className={cn(
                        "group flex flex-1 cursor-pointer items-center rounded-md text-left ring-inset focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden",
                        variant === "header" &&
                            "gap-x-2 px-2 py-1.5 text-[12px] font-medium text-neutral-500 capitalize",
                        variant === "inline" &&
                            "gap-x-2 px-2 py-1.5 text-[12px] font-medium text-neutral-400",
                        isTree &&
                            "gap-1 rounded-[5px] px-2 py-1 text-[12.5px] font-medium tracking-wider text-overlay/65 hover:bg-hover hover:text-neutral-100",
                    )}
                >
                    {isTree && (
                        <span className="flex size-5 shrink-0 items-center justify-center">
                            {Icon && <Icon className="size-4" aria-hidden />}
                        </span>
                    )}
                    <span className={cn("truncate", isTree && "min-w-0 flex-1")}>{title}</span>
                    <DropdownCaretIcon
                        className={cn(
                            "size-3 shrink-0 text-neutral-500 transition-transform",
                            !open && "-rotate-90",
                        )}
                        aria-hidden
                    />
                </Button>
                {action && <span className="flex items-center">{action}</span>}
            </div>

            <motion.div
                initial={false}
                animate={open ? "open" : "closed"}
                variants={CONTAINER_VARIANTS}
                className={cn("flex flex-col overflow-hidden", !isTree && "gap-0.5")}
                aria-hidden={!open}
            >
                {rows.map((child, index) => (
                    <motion.div
                        key={child.key}
                        variants={ROW_VARIANTS}
                        className={cn(isTree && "relative")}
                    >
                        {child}
                        {isTree && <TreeBranch last={index === rows.length - 1} />}
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
