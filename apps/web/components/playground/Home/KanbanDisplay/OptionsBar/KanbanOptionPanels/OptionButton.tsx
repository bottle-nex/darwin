"use client";
import { Button } from "@/components/ui/button";
import { forwardRef } from "react";
import type { IconType } from "react-icons";
import IconWrapper from "@/components/ui/IconWrapper";
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
    ({ label, icon, active, className, ...props }, ref) => (
        <Button
            variant="unstyled"
            ref={ref}
            type="button"
            aria-label={label}
            aria-pressed={active}
            className={cn("group flex shrink-0 cursor-pointer rounded-full", className)}
            {...props}
        >
            <IconWrapper icon={icon} active={active} variant="ghost" className="hover:bg-transparent!" />
        </Button>
    ),
);
OptionButton.displayName = "OptionButton";

export default OptionButton;
