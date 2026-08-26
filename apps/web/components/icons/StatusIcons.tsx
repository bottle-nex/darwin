import type { ReactNode } from "react";
import type { IconBaseProps } from "react-icons";

import { cn } from "@/lib/utils";

const MARK = {
    stroke: "var(--color-ink)",
    strokeWidth: 42,
    strokeLinecap: "round",
    strokeLinejoin: "round",
} as const;

/**
 * A settled status: a filled disc in the status colour, with its mark cut across it in ink.
 *
 * The Ionicons equivalents punch their mark out of the disc, so the mark takes whatever sits behind
 * the icon — the board, a card, a white menu row — and disappears on the light ones. Drawing the
 * mark as its own path keeps it readable wherever the icon lands.
 */
function StatusDisc({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <svg
            viewBox="0 0 512 512"
            fill="none"
            aria-hidden
            focusable="false"
            className={cn("size-4", className)}
        >
            <circle cx="256" cy="256" r="208" fill="currentColor" />
            {children}
        </svg>
    );
}

export function DoneStatusIcon({ className }: IconBaseProps) {
    return (
        <StatusDisc className={className}>
            <path d="M162 266l56 56 132-132" {...MARK} />
        </StatusDisc>
    );
}

export function FailedStatusIcon({ className }: IconBaseProps) {
    return (
        <StatusDisc className={className}>
            <path d="M256 166v180M166 256h180" transform="rotate(45 256 256)" {...MARK} />
        </StatusDisc>
    );
}
