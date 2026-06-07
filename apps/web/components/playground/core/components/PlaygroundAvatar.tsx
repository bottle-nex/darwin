import { cn } from "@/lib/utils";

const AVATAR_TONE = {
    dark: "bg-neutral-800 text-white",
    indigo: "bg-indigo-500 text-white",
    purple: "bg-violet-500 text-white",
    blue: "bg-blue-500 text-white",
    emerald: "bg-emerald-500 text-white",
} as const;

export type AvatarTone = keyof typeof AVATAR_TONE;

const AVATAR_SIZE = {
    sm: "size-4 text-[9px]",
    md: "size-5 text-[11px]",
    xl: "size-8 text-[14px]",
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
                "inline-flex shrink-0 items-center justify-center rounded-[5px] font-semibold leading-none",
                AVATAR_SIZE[size],
                AVATAR_TONE[tone],
                className,
            )}
            aria-hidden
        >
            {letter}
        </span>
    );
}
