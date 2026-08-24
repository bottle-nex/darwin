"use client";
import type { ReactNode } from "react";
import { MdCheck } from "react-icons/md";

import { cn } from "@/lib/utils";

import PlaygroundAvatar, { type AvatarSize, toneFor } from "./PlaygroundAvatar";

type MemberOptionRowProps = {
    id: string;
    label: string;
    avatarSrc?: string | null;
    avatarSize?: AvatarSize;
    checked: boolean;
    secondaryLabel?: string;
    trailing?: ReactNode;
};

/** A person row shared by every multi-select member picker: checkbox, avatar, name. */
export default function MemberOptionRow({
    id,
    label,
    avatarSrc,
    avatarSize = "sm",
    checked,
    secondaryLabel,
    trailing,
}: MemberOptionRowProps) {
    return (
        <>
            <span
                className={cn(
                    "flex size-3.5 shrink-0 items-center justify-center rounded border transition-colors",
                    checked
                        ? "border-neutral-200 bg-neutral-200 text-neutral-900"
                        : "border-white/25",
                )}
            >
                {checked && <MdCheck className="size-2.5" aria-hidden />}
            </span>
            <PlaygroundAvatar
                letter={label.charAt(0).toUpperCase()}
                tone={toneFor(id)}
                src={avatarSrc}
                size={avatarSize}
            />
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] text-neutral-100">{label}</span>
                {secondaryLabel && (
                    <span className="truncate text-[11px] text-neutral-500">{secondaryLabel}</span>
                )}
            </span>
            {trailing}
        </>
    );
}
