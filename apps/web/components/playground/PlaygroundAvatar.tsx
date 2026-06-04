import { cn } from "@/lib/utils";

/** Tone token → concrete background/text classes. */
const AVATAR_TONE = {
    dark: "bg-neutral-800 text-white",
    indigo: "bg-indigo-500 text-white",
    purple: "bg-violet-500 text-white",
    blue: "bg-blue-500 text-white",
    emerald: "bg-emerald-500 text-white",
} as const;

export type AvatarTone = keyof typeof AVATAR_TONE;

type PlaygroundAvatarProps = {
    letter: string;
    tone: AvatarTone;
    size?: "sm" | "md";
    className?: string;
};

/**
 * Small letter avatar used across the playground — workspace logo, teams,
 * agents. Tone tokens map to concrete classes via AVATAR_TONE so usage sites
 * stay declarative.
 */
export default function PlaygroundAvatar({
    letter,
    tone,
    size = "md",
    className,
}: PlaygroundAvatarProps) {
    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-[5px] font-semibold leading-none",
                size === "sm" ? "size-4 text-[9px]" : "size-5 text-[11px]",
                AVATAR_TONE[tone],
                className,
            )}
            aria-hidden
        >
            {letter}
        </span>
    );
}
