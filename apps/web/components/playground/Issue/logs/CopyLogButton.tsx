"use client";
import { CheckIcon, CopyIcon } from "@trymatcha/ui/icons";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const COPIED_MS = 1200;

export default function CopyLogButton({
    label,
    text,
    className,
}: {
    label: string;
    text: () => string;
    className?: string;
}) {
    const [copied, setCopied] = useState(false);
    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (timeout.current) clearTimeout(timeout.current);
        },
        [],
    );

    function copy() {
        const value = text();
        if (!value) return;
        void navigator.clipboard.writeText(value);
        setCopied(true);
        if (timeout.current) clearTimeout(timeout.current);
        timeout.current = setTimeout(() => setCopied(false), COPIED_MS);
    }

    return (
        <button
            type="button"
            aria-label={label}
            onClick={copy}
            className={cn(
                "flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-[4px] text-neutral-500 transition-colors hover:bg-snow/6 hover:text-snow",
                className,
            )}
        >
            {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
        </button>
    );
}
