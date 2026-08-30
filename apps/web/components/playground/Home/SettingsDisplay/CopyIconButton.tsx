"use client";
import { CheckIcon, CopyIcon } from "@trymatcha/ui/icons";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export default function CopyIconButton({
    value,
    label = "Copy",
    className,
}: {
    value: string;
    label?: string;
    className?: string;
}) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const timeout = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(timeout);
    }, [copied]);

    function handleCopy() {
        navigator.clipboard.writeText(value);
        setCopied(true);
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            aria-label={label}
            className={cn(
                "relative flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] bg-snow/8 text-neutral-400 transition-colors hover:bg-snow/12 hover:text-neutral-200",
                className,
            )}
        >
            <CopyIcon
                className={cn(
                    "size-3.5 transition-all duration-200 ease-out",
                    copied ? "scale-90 opacity-0 blur-[2px]" : "scale-100 opacity-100 blur-none",
                )}
                aria-hidden
            />
            <CheckIcon
                className={cn(
                    "absolute size-3.5 text-matcha transition-all duration-200 ease-out",
                    copied ? "scale-100 opacity-100 blur-none" : "scale-90 opacity-0 blur-[2px]",
                )}
                aria-hidden
            />
        </button>
    );
}
