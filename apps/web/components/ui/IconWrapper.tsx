import { cn } from "@/lib/utils";
import type { IconType } from "react-icons";

type IconWrapperVariant = "solid" | "ghost";

interface IconWrapperProps {
    icon: IconType;
    active?: boolean;
    variant?: IconWrapperVariant;
    className?: string;
}

const SURFACE: Record<
    IconWrapperVariant,
    { shape: string; glyph: string; rest: string; active: string }
> = {
    solid: {
        shape: "rounded-sm",
        glyph: "size-3.25",
        rest: "bg-graphite/70 ring-[0.5px] ring-white/8",
        active: "bg-white/8 ring-[0.5px] ring-white/12",
    },
    ghost: {
        shape: "rounded-full",
        glyph: "size-3.75",
        rest: "bg-transparent",
        active: "bg-white/8",
    },
};

export default function IconWrapper({
    icon: Icon,
    active,
    variant = "solid",
    className,
}: IconWrapperProps) {
    const surface = SURFACE[variant];

    return (
        <span
            className={cn(
                "flex size-6.75 items-center justify-center transition-colors",
                surface.shape,
                active
                    ? cn(surface.active, "text-neutral-100")
                    : cn(
                          surface.rest,
                          "text-neutral-400 group-hover:bg-white/8 group-hover:text-neutral-200",
                      ),
                className,
            )}
        >
            <Icon className={surface.glyph} aria-hidden />
        </span>
    );
}
