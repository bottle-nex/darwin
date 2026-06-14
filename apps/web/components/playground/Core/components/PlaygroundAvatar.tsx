import { cn } from "@/lib/utils";

const AVATAR_TONE = {
    dark: "bg-linear-to-br from-neutral-600 via-neutral-700 to-neutral-900 text-white shadow-[0_2px_6px_-1px_rgba(0,0,0,0.45)]",
    indigo: "bg-linear-to-br from-indigo-400 via-indigo-500 to-indigo-700 text-white shadow-[0_2px_6px_-1px_rgba(79,70,229,0.5)]",
    purple: "bg-linear-to-br from-[#C7B9FF] via-[#9D8AF5] to-[#6C55DE] text-white shadow-[0_2px_6px_-1px_rgba(108,85,222,0.5)]",
    blue: "bg-linear-to-br from-sky-400 via-blue-500 to-blue-700 text-white shadow-[0_2px_6px_-1px_rgba(37,99,235,0.5)]",
    emerald:
        "bg-linear-to-br from-emerald-400 via-emerald-500 to-emerald-700 text-white shadow-[0_2px_6px_-1px_rgba(16,185,129,0.5)]",
} as const;

export type AvatarTone = keyof typeof AVATAR_TONE;

const AVATAR_SIZE = {
    sm: "size-4 text-[9px] rounded-[5px]",
    md: "size-5 text-[11px] rounded-[6px]",
    xl: "size-8 text-[14px] rounded-[8px]",
} as const;

export type AvatarSize = keyof typeof AVATAR_SIZE;

type PlaygroundAvatarProps = {
    letter: string;
    tone: AvatarTone;
    size?: AvatarSize;
    className?: string;
};

export default function PlaygroundAvatar({
    letter,
    tone,
    size = "md",
    className,
}: PlaygroundAvatarProps) {
    return (
        <span
            className={cn(
                "relative inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold leading-none",
                "ring-1 ring-inset ring-white/15",
                // top sheen — bright highlight fading to nothing, like the logo's radial sheen
                "before:pointer-events-none before:absolute before:inset-0 before:bg-linear-to-b before:from-white/35 before:to-transparent before:opacity-80",
                AVATAR_SIZE[size],
                AVATAR_TONE[tone],
                className,
            )}
            aria-hidden
        >
            <span className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">{letter}</span>
        </span>
    );
}
