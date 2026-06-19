"use client";
import { forwardRef } from "react";
import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";

type OptionButtonProps = {
    label: string;
    icon: IconType;
    /** When active (panel open / filter applied), keep the hover look pinned. */
    active?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Shared icon button for the options toolbar. Works as a plain toggle or as a
 * radix dropdown trigger (`asChild`) — hence forwardRef + prop spreading. When
 * `active`, it keeps the same background/text it shows on hover, so an applied
 * filter / open panel / visible search bar reads as "on".
 */
const OptionButton = forwardRef<HTMLButtonElement, OptionButtonProps>(
    ({ label, icon: Icon, active, className, ...props }, ref) => (
        <button
            ref={ref}
            type="button"
            aria-label={label}
            aria-pressed={active}
            className={cn(
                "flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors",
                active
                    ? "bg-white/5 text-neutral-200"
                    : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200",
                className,
            )}
            {...props}
        >
            <Icon className="size-4" aria-hidden />
        </button>
    ),
);
OptionButton.displayName = "OptionButton";

export default OptionButton;
