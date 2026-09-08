import type { IconType } from "@trydarwin/ui/icons";
import type { CSSProperties, ReactNode } from "react";

import { TooltipComponent } from "@/components/ui/tooltip-component";
import { cn } from "@/lib/utils";

type IconWrapperVariant = "solid" | "ghost" | "outline" | "ring";

type IconWrapperSize = "small" | "big";

/**
 * Which ancestor's hover this icon follows. `ancestor` is the nearest unnamed
 * `group`; `card` is the board card's own `group/card`, for icons that sit inside
 * a column whose bare `group` would otherwise light every card at once.
 */
type HoverGroup = "ancestor" | "card";

interface IconWrapperProps {
    icon?: IconType;
    iconClassName?: string;
    /** Inline style for the icon, e.g. a user-picked hex color Tailwind can't express as a class. */
    iconStyle?: CSSProperties;
    dotColor?: string;
    children?: ReactNode;
    active?: boolean;
    variant?: IconWrapperVariant;
    size?: IconWrapperSize;
    hoverGroup?: HoverGroup;
    className?: string;
    /** Shown as a tooltip on hover. Rendered through `TooltipComponent`, not the native attribute. */
    title?: ReactNode;
}

const SURFACE: Record<
    IconWrapperVariant,
    {
        shape: string;
        glyph: Record<IconWrapperSize, string>;
        rest: string;
        hover: string;
        active: string;
    }
> = {
    solid: {
        shape: "rounded-sm",
        glyph: { small: "size-3.25", big: "size-3.75" },
        rest: "bg-graphite/70 ring-[0.5px] ring-white/8",
        hover: "hover:bg-white/8",
        active: "bg-white/8 ring-[0.5px] ring-white/12",
    },
    ghost: {
        shape: "rounded-full",
        glyph: { small: "size-3.75", big: "size-4.25" },
        rest: "bg-transparent",
        hover: "hover:bg-white/8",
        active: "bg-white/8",
    },
    outline: {
        shape: "rounded-full ring-[0.5px] ring-white/10",
        glyph: { small: "size-3.5", big: "size-4" },
        rest: "bg-transparent",
        hover: "hover:border-white/20 hover:bg-white/5",
        active: "border-white/20 bg-white/8",
    },
    ring: {
        shape: "rounded-full ring-[0.5px] ring-snow/10",
        glyph: { small: "size-3.75", big: "size-4.25" },
        rest: "bg-transparent",
        hover: "hover:bg-white/8",
        active: "bg-white/8 ring-snow/20",
    },
};

const SIZE: Record<IconWrapperSize, { box: string; label: string; dot: string }> = {
    small: { box: "size-6.75", label: "h-5 gap-1.5 px-2 text-[11px]", dot: "size-2" },
    big: { box: "size-7.75", label: "h-6 gap-1.75 px-2.5 text-[11.5px]", dot: "size-2.25" },
};

/** Spelled out per group name because Tailwind only generates classes it can read literally. */
const GROUP_HOVER: Record<HoverGroup, Record<IconWrapperVariant, string>> = {
    ancestor: {
        solid: "group-hover:bg-white/8 group-hover:text-neutral-200",
        ghost: "group-hover:bg-white/8 group-hover:text-neutral-200",
        outline: "group-hover:text-neutral-200",
        ring: "group-hover:bg-white/8 group-hover:text-neutral-200",
    },
    card: {
        solid: "group-hover/card:bg-white/8 group-hover/card:text-neutral-200",
        ghost: "group-hover/card:bg-white/8 group-hover/card:text-neutral-200",
        outline: "group-hover/card:text-neutral-200",
        ring: "group-hover/card:bg-white/8 group-hover/card:text-neutral-200",
    },
};

export default function IconWrapper({
    icon: Icon,
    iconClassName,
    iconStyle,
    dotColor,
    children,
    active,
    variant = "solid",
    size = "small",
    hoverGroup = "ancestor",
    className,
    title,
}: IconWrapperProps) {
    const surface = SURFACE[variant];
    const scale = SIZE[size];
    const hasLabel = children !== undefined && children !== null;

    const glyph = (
        <span
            className={cn(
                "inline-flex items-center justify-center transition-colors",
                hasLabel ? cn(scale.label, "leading-none") : scale.box,
                surface.shape,
                active
                    ? cn(surface.active, "text-neutral-100")
                    : cn(
                          surface.rest,
                          surface.hover,
                          "text-neutral-400",
                          GROUP_HOVER[hoverGroup][variant],
                      ),
                className,
            )}
        >
            {dotColor && (
                <span
                    className={cn("shrink-0 rounded-full", scale.dot)}
                    style={{ backgroundColor: dotColor }}
                    aria-hidden
                />
            )}
            {Icon && (
                <Icon
                    className={cn(surface.glyph[size], iconClassName)}
                    style={iconStyle}
                    aria-hidden
                />
            )}
            {hasLabel && <span className="truncate">{children}</span>}
        </span>
    );

    return (
        <TooltipComponent delayDuration={1000} content={title}>
            {glyph}
        </TooltipComponent>
    );
}
