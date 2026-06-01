"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type SidebarChild = {
    key: string;
    label: string;
    description: string;
    icon: React.ElementType;
};

type PlaygroundSidebarPanelProps = {
    label: string;
    items: SidebarChild[];
};

const PANEL_WIDTH = 224;

const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
};

const itemVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: { opacity: 1, x: 0 },
};

export default function PlaygroundSidebarPanel({ label, items }: PlaygroundSidebarPanelProps) {
    const [selectedKey, setSelectedKey] = useState(items[0]?.key);

    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: PANEL_WIDTH, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.215, 0.61, 0.355, 1] }}
            className="h-full shrink-0 overflow-hidden"
        >
            <div className="flex h-full w-56 flex-col border-l border-neutral-800/80">
                <motion.nav
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-3 mt-2.5"
                    aria-label={`${label} sections`}
                >
                    {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = selectedKey === item.key;

                        return (
                            <motion.button
                                key={item.key}
                                variants={itemVariants}
                                type="button"
                                onClick={() => setSelectedKey(item.key)}
                                aria-current={isActive ? "true" : undefined}
                                className={cn(
                                    "group flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-left outline-none transition-colors duration-150",
                                    "focus-visible:ring-2 focus-visible:ring-[#9bc24f]/40",
                                    isActive ? "bg-[#9bc24f]/10" : "hover:bg-neutral-800/60",
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "size-4 shrink-0 transition-colors duration-150",
                                        isActive
                                            ? "text-[#bcdb6f]"
                                            : "text-neutral-500 group-hover:text-neutral-300",
                                    )}
                                    aria-hidden
                                />
                                <span className="min-w-0 flex-1">
                                    <span
                                        className={cn(
                                            "block truncate text-[13px] font-medium leading-tight transition-colors duration-150",
                                            isActive
                                                ? "text-neutral-100"
                                                : "text-neutral-300 group-hover:text-neutral-100",
                                        )}
                                    >
                                        {item.label}
                                    </span>
                                    <span className="block truncate text-[11px] leading-tight text-neutral-500">
                                        {item.description}
                                    </span>
                                </span>
                            </motion.button>
                        );
                    })}
                </motion.nav>
            </div>
        </motion.div>
    );
}
