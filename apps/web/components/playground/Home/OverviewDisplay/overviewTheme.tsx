import type { ComponentType } from "react";
import { MdLink, MdMenuBook, MdPublic, MdScience } from "react-icons/md";
import { FaGithub } from "react-icons/fa6";
import { SiNotion } from "react-icons/si";
import { cn } from "@/lib/utils";
import type { OverviewLinkKind, OverviewStatus } from "@/types/overview";
import FigmaMark from "./FigmaMark";

type LinkTheme = {
    icon: ComponentType<{ className?: string }>;
    tint: string;
};

export const LINK_KIND: Record<OverviewLinkKind, LinkTheme> = {
    figma: { icon: FigmaMark, tint: "" },
    github: { icon: FaGithub, tint: "text-neutral-200" },
    notion: { icon: SiNotion, tint: "text-neutral-200" },
    live: { icon: MdPublic, tint: "text-emerald-300" },
    staging: { icon: MdScience, tint: "text-amber-300" },
    docs: { icon: MdMenuBook, tint: "text-sky-300" },
    other: { icon: MdLink, tint: "text-neutral-400" },
};

export const STATUS_THEME: Record<OverviewStatus, { label: string; dot: string; text: string }> = {
    active: { label: "Active", dot: "bg-emerald-400", text: "text-emerald-300" },
    paused: { label: "Paused", dot: "bg-amber-400", text: "text-amber-300" },
    archived: { label: "Archived", dot: "bg-neutral-500", text: "text-neutral-400" },
};

export const EASE = [0.4, 0, 0.2, 1] as const;

export const SECTION_VARIANTS = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE } },
};

export const STAGGER_VARIANTS = {
    hidden: {},
    show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
};

export function approxTokensOf(markdown: string): string {
    const tokens = Math.round(markdown.length / 4);
    return tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : String(tokens);
}

export function SectionLabel({ children, className }: { children: string; className?: string }) {
    return (
        <span className={cn("block text-[12px] font-medium text-neutral-400", className)}>
            {children}
        </span>
    );
}

export function MetaDot() {
    return <span className="size-0.5 shrink-0 rounded-full bg-white/25" aria-hidden />;
}
