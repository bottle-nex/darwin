import type { IconBaseProps } from "react-icons";

import { cn } from "@/lib/utils";

/**
 * Done, drawn rather than imported.
 *
 * IoIosCheckmarkCircle is one path with the check punched out of the disc, so the check takes
 * whatever sits behind the icon — the board, a card, a menu row — and never reads as a mark. Two
 * paths let the disc follow the status colour while the check stays ink on every surface.
 */
export function DoneStatusIcon({ className }: IconBaseProps) {
    return (
        <svg
            viewBox="0 0 512 512"
            fill="none"
            aria-hidden
            focusable="false"
            className={cn("size-4", className)}
        >
            <circle cx="256" cy="256" r="208" fill="currentColor" />
            <path
                d="M162 266l56 56 132-132"
                stroke="var(--color-ink)"
                strokeWidth="42"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
