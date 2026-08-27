import type { IconType } from "@trymatcha/ui/icons";
import type { CSSProperties, ReactNode } from "react";

import { TooltipComponent } from "@/components/ui/tooltip-component";
import { cn } from "@/lib/utils";

type IconWrapperVariant = "solid" | "ghost" | "outline" | "ring";

interface IconWrapperProps {
    icon?: IconType;
    iconClassName?: string;
    /** Inline style for the icon, e.g. a user-picked hex color Tailwind can't express as a class. */
    iconStyle?: CSSProperties;
    dotColor?: string;
    children?: ReactNode;
    active?: boolean;
    variant?: IconWrapperVariant;
    className?: string;
    /** Shown as a tooltip on hover. Rendered through `TooltipComponent`, not the native attribute. */
    title?: ReactNode;
}

const SURFACE: Record<
    IconWrapperVariant,
    { shape: string; glyph: string; rest: string; hover: string; active: string }
> = {
    solid: {
        shape: "rounded-sm",
        glyph: "size-3.25",
        rest: "bg-graphite/70 ring-[0.5px] ring-white/8",
        hover: "hover:bg-white/8 group-hover:bg-white/8",
        active: "bg-white/8 ring-[0.5px] ring-white/12",
    },
    ghost: {
        shape: "rounded-full",
        glyph: "size-3.75",
        rest: "bg-transparent",
        hover: "hover:bg-white/8 group-hover:bg-white/8",
        active: "bg-white/8",
    },
    outline: {
        shape: "rounded-full ring-[0.5px] ring-white/10",
        glyph: "size-3.5",
        rest: "bg-transparent",
        hover: "hover:border-white/20 hover:bg-white/5",
        active: "border-white/20 bg-white/8",
    },
    ring: {
        shape: "rounded-full ring-[0.5px] ring-snow/10",
        glyph: "size-3.75",
        rest: "bg-transparent",
        hover: "hover:bg-white/8 group-hover:bg-white/8",
        active: "bg-white/8 ring-snow/20",
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
    className,
    title,
}: IconWrapperProps) {
    const surface = SURFACE[variant];
    const hasLabel = children !== undefined && children !== null;

    const glyph = (
        <span
            className={cn(
                "inline-flex items-center justify-center gap-1.5 transition-colors",
                hasLabel ? "h-5 px-2 text-[11px] leading-none" : "size-6.75",
                surface.shape,
                active
                    ? cn(surface.active, "text-neutral-100")
                    : cn(
                          surface.rest,
                          surface.hover,
                          "text-neutral-400 group-hover:text-neutral-200",
                      ),
                className,
            )}
        >
            {dotColor && (
                <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: dotColor }}
                    aria-hidden
                />
            )}
            {Icon && (
                <Icon className={cn(surface.glyph, iconClassName)} style={iconStyle} aria-hidden />
            )}
            {hasLabel && <span className="truncate">{children}</span>}
        </span>
    );

    return <TooltipComponent content={title}>{glyph}</TooltipComponent>;
}
