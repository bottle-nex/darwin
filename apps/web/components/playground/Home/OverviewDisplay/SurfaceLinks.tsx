"use client";
import { motion } from "motion/react";
import { LuArrowUpRight } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { OverviewLink } from "@/types/overview";
import { LINK_KIND, SECTION_VARIANTS } from "./overviewTheme";

type SurfaceLinksProps = {
    links: OverviewLink[];
};

export default function SurfaceLinks({ links }: SurfaceLinksProps) {
    if (!links.length) return null;

    return (
        <motion.nav variants={SECTION_VARIANTS} className="flex flex-wrap items-center gap-2">
            {links.map((link) => {
                const theme = LINK_KIND[link.kind];
                const Icon = theme.icon;

                return (
                    <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-2 rounded-lg bg-white/4 py-1.5 pr-2.5 pl-1.5 transition-colors hover:bg-white/8"
                    >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/6">
                            <Icon className={cn("size-3.5", theme.tint)} />
                        </span>

                        <span className="text-[13px] text-neutral-300 transition-colors group-hover:text-neutral-100">
                            {link.label}
                        </span>

                        <LuArrowUpRight
                            aria-hidden
                            className="size-3.5 shrink-0 text-neutral-600 transition-all duration-150 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-neutral-300"
                        />
                    </a>
                );
            })}
        </motion.nav>
    );
}
