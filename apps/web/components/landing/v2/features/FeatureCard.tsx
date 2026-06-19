import type { IconType } from "react-icons";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { azeretMono } from "@/components/ui/button";
import Reveal from "@/components/utility/Reveal";

/** Fine, dense film grain — fractal-noise SVG kept inline so the textured cards
 *  read as a real product surface rather than a flat fill. */
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/** Layered "soft light bloom over a deep base" surfaces — a large feathered
 *  highlight composited on a deep, low-saturation base for an atmospheric,
 *  premium gradient (rather than one hard multi-stop ramp). */
const DARK_SURFACE = {
    backgroundImage:
        "radial-gradient(72% 55% at 50% -8%, rgba(206,212,228,0.18) 0%, rgba(206,212,228,0) 56%), linear-gradient(159deg, #262630 0%, #17161b 50%, #0d0d10 100%)",
};
const PRIMARY_SURFACE = {
    backgroundImage:
        "radial-gradient(115% 95% at 74% -10%, rgba(249,245,255,0.52) 0%, rgba(249,245,255,0.18) 38%, rgba(249,245,255,0) 70%), radial-gradient(95% 100% at 110% 116%, #241a52 0%, rgba(36,26,82,0) 58%), linear-gradient(150deg, #8b79e8 0%, #6856c6 46%, #463a8e 100%)",
};

type FeatureCardProps = {
    index: string;
    icon: IconType;
    title: string;
    description: string;
    /** Light cells match the base grid; dark / primary cells carry grain + the real app UI. */
    tone?: "light" | "dark" | "primary" | "ink";
    /** Microinteraction / mini app-UI rendered at the foot of the card. */
    preview?: ReactNode;
    delay?: number;
};

export default function FeatureCard({
    index,
    icon: Icon,
    title,
    description,
    tone = "light",
    preview,
    delay = 0,
}: FeatureCardProps) {
    const dark = tone === "dark";
    const primary = tone === "primary";
    const ink = tone === "ink";
    const light = tone === "light";
    const grain = dark || primary;
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-lg transition-all duration-300 ease-out hover:z-10 hover:shadow-sm hover:shadow-neutral-800 border border-neutral-200",
                dark && "border-white/10 hover:border-white/20 hover:shadow-black/50 border-none",
                primary &&
                    "border-transparent hover:border-white/30 hover:shadow-[#AB9FF2]/40 border-none",
                ink &&
                    "bg-ink/50 border-none hover:shadow-black/50 border-neutral-800 border shadow-[inset_0_2px_0_0_#262626]",
                light &&
                    "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-neutral-900/10",
            )}
            style={dark ? DARK_SURFACE : primary ? PRIMARY_SURFACE : undefined}
        >
            {grain && (
                <span
                    aria-hidden
                    className={cn(
                        "pointer-events-none absolute inset-0 z-0",
                        dark && "opacity-[0.55] mix-blend-soft-light",
                        primary && "opacity-[0.85] mix-blend-overlay",
                    )}
                    style={{ backgroundImage: GRAIN }}
                />
            )}
            <Reveal
                delay={delay}
                className="group relative z-10 flex h-full flex-col gap-5 p-6 sm:p-8"
            >
                <div className="flex items-center justify-between">
                    <Icon
                        className={cn(
                            "size-5 transition-colors duration-200",
                            dark && "text-neutral-500 group-hover:text-[#AB9FF2]",
                            primary && "text-[#AB9FF2]",
                            ink && "text-neutral-500 group-hover:text-[#AB9FF2]",
                            light && "text-neutral-400 group-hover:text-[#AB9FF2]",
                        )}
                        aria-hidden
                    />
                    <span
                        className={cn(
                            "text-xs uppercase tracking-wide",
                            azeretMono.className,
                            dark && "text-neutral-600",
                            primary && "text-neutral-700",
                            ink && "text-neutral-600",
                            light && "text-neutral-400",
                        )}
                    >
                        {index}
                    </span>
                </div>
                <div
                    className={cn("text-xl", dark || ink ? "text-neutral-50" : "text-neutral-900")}
                >
                    {title}
                </div>
                <p
                    className={cn(
                        "text-sm leading-relaxed",
                        dark && "text-neutral-400",
                        primary && "text-neutral-800",
                        ink && "text-neutral-400",
                        light && "text-neutral-500",
                    )}
                >
                    {description}
                </p>
                {preview && <div className="mt-auto pt-2">{preview}</div>}
            </Reveal>
        </div>
    );
}
