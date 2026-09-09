"use client";
import type { IconType } from "@trydarwin/ui/icons";
import { forwardRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OptionButtonProps = {
    label: string;
    icon: IconType;
    active?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const OptionButton = forwardRef<HTMLButtonElement, OptionButtonProps>(
    ({ label, icon: Icon, active, className, ...props }, ref) => (
        <Button
            variant="unstyled"
            ref={ref}
            type="button"
            aria-label={label}
            aria-pressed={active}
            className={cn(
                "flex size-6.75 shrink-0 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent text-neutral-400 transition-colors hover:bg-overlay/8 hover:text-neutral-200",
                active && "text-neutral-100",
                className,
            )}
            {...props}
        >
            <Icon className="size-3.75" aria-hidden />
        </Button>
    ),
);
OptionButton.displayName = "OptionButton";

export default OptionButton;
