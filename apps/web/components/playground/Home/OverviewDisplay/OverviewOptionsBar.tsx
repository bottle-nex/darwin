"use client";
import { useEffect, useState } from "react";
import { LuCheck, LuCopy } from "react-icons/lu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const PLAIN_BUTTON = "font-sans normal-case";

type OverviewOptionsBarProps = {
    briefMarkdown: string;
};

export default function OverviewOptionsBar({ briefMarkdown }: OverviewOptionsBarProps) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), 1200);
        return () => clearTimeout(timer);
    }, [copied]);

    async function copyBrief() {
        try {
            await navigator.clipboard.writeText(briefMarkdown);
            setCopied(true);
        } catch {
            toast.error("Couldn't reach the clipboard.");
        }
    }

    return (
        <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/5 px-3">
            <span className="shrink-0 text-[13px] font-medium text-neutral-200">Overview</span>

            <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={copyBrief}
                className={cn(PLAIN_BUTTON, "text-neutral-400 hover:bg-white/5")}
            >
                {copied ? (
                    <LuCheck className="text-emerald-300" aria-hidden />
                ) : (
                    <LuCopy aria-hidden />
                )}
                {copied ? "Copied" : "Copy for agent"}
            </Button>
        </div>
    );
}
