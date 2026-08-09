"use client";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

const AVATAR_TONE = {
    indigo: {
        bg: "bg-linear-to-br from-indigo-400 via-indigo-500 to-indigo-700 text-white",
        glow: "shadow-[0_2px_6px_-1px_rgba(79,70,229,0.5)]",
    },
    purple: {
        bg: "bg-linear-to-br from-[#C7B9FF] via-[#9D8AF5] to-[#6C55DE] text-white",
        glow: "shadow-[0_2px_6px_-1px_rgba(108,85,222,0.5)]",
    },
    blue: {
        bg: "bg-linear-to-br from-sky-400 via-blue-500 to-blue-700 text-white",
        glow: "shadow-[0_2px_6px_-1px_rgba(37,99,235,0.5)]",
    },
    emerald: {
        bg: "bg-linear-to-br from-emerald-400 via-emerald-500 to-emerald-700 text-white",
        glow: "shadow-[0_2px_6px_-1px_rgba(16,185,129,0.5)]",
    },
    dark: {
        bg: "bg-linear-to-br from-neutral-600 via-neutral-700 to-neutral-900 text-white",
        glow: "shadow-[0_2px_6px_-1px_rgba(0,0,0,0.45)]",
    },
} as const;

const AVATAR_SIZE = {
    sm: "size-4 text-[9px] rounded-[5px]",
    md: "size-5 text-[11px] rounded-[6px]",
    lg: "size-6 text-[12px] rounded-[7px]",
    xl: "size-8 text-[14px] rounded-[8px]",
} as const;

export type AvatarTone = keyof typeof AVATAR_TONE;
export type AvatarSize = keyof typeof AVATAR_SIZE;

const BASE =
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold leading-none ring-1 ring-inset ring-white/15";

// top sheen — bright highlight fading to nothing, like the logo's radial sheen
const SHEEN =
    "before:pointer-events-none before:absolute before:inset-0 before:bg-linear-to-b before:from-white/35 before:to-transparent before:opacity-80";

const TONES = Object.keys(AVATAR_TONE) as AvatarTone[];

/** Deterministic tone so a person keeps the same color across renders. */
export function toneFor(id: string): AvatarTone {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return TONES[hash % TONES.length];
}

/** `User.name` is nullable, `User.email` is not — so this never returns "". */
export function displayNameOf(name: string | null | undefined, email: string): string {
    return name?.trim() || email.split("@")[0];
}

export function initialOf(name: string | null | undefined, email: string): string {
    return displayNameOf(name, email)[0].toUpperCase();
}

type PlaygroundAvatarProps = {
    letter: string;
    tone: AvatarTone;
    src?: string | null;
    size?: AvatarSize;
    className?: string;
};

/** A photo when `src` is set, otherwise the toned letter tile. */
export default function PlaygroundAvatar({
    letter,
    tone,
    src,
    size = "md",
    className,
}: PlaygroundAvatarProps) {
    const { bg, glow } = AVATAR_TONE[tone];
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const photoSrc = src && src !== failedSrc ? src : null;

    return (
        <span
            className={cn(BASE, AVATAR_SIZE[size], bg, !photoSrc && [SHEEN, glow], className)}
            aria-hidden
        >
            {photoSrc ? (
                <Image
                    src={photoSrc}
                    alt=""
                    fill
                    sizes="32px"
                    onError={() => setFailedSrc(photoSrc)}
                    className="object-cover"
                />
            ) : (
                <span className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">{letter}</span>
            )}
        </span>
    );
}
