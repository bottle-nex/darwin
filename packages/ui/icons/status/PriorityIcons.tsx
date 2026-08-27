import clsx from "clsx";
import type { IconBaseProps } from "react-icons";

export function HighPriorityIcon({ className }: IconBaseProps) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden
            focusable="false"
            className={clsx("size-4 text-snow", className)}
        >
            <rect x="1.5" y="8" width="3" height="6" rx="1" />
            <rect x="6.5" y="5" width="3" height="9" rx="1" />
            <rect x="11.5" y="2" width="3" height="12" rx="1" />
        </svg>
    );
}

export function MediumPriorityIcon({ className }: IconBaseProps) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden
            focusable="false"
            className={clsx("size-4 text-snow", className)}
        >
            <rect x="1.5" y="8" width="3" height="6" rx="1" />
            <rect x="6.5" y="5" width="3" height="9" rx="1" />
            <rect x="11.5" y="2" width="3" height="12" rx="1" fillOpacity="0.4" />
        </svg>
    );
}

export function LowPriorityIcon({ className }: IconBaseProps) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden
            focusable="false"
            className={clsx("size-4 text-snow", className)}
        >
            <rect x="1.5" y="8" width="3" height="6" rx="1" />
            <rect x="6.5" y="5" width="3" height="9" rx="1" fillOpacity="0.4" />
            <rect x="11.5" y="2" width="3" height="12" rx="1" fillOpacity="0.4" />
        </svg>
    );
}
