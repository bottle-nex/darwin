"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MyIssuesView } from "@/store/issues/useMyIssuesOptionsStore";
import { MyIssuesControls } from "./MyIssuesOptionsBar";

const VIEWS = [
    { value: "assigned", label: "Assigned" },
    { value: "created", label: "Created" },
] as const;

export default function MyIssuesViewBar({
    view,
    onViewChange,
}: {
    view: MyIssuesView;
    onViewChange: (view: MyIssuesView) => void;
}) {
    return (
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
            <div role="tablist" aria-label="My issues views" className="flex items-center gap-1.5">
                {VIEWS.map((option) => (
                    <Button
                        key={option.value}
                        variant="unstyled"
                        type="button"
                        role="tab"
                        aria-selected={view === option.value}
                        onClick={() => onViewChange(option.value)}
                        className={cn(
                            "cursor-pointer rounded-full px-3 py-1 text-[11px] font-medium ring-1 ring-inset transition-colors",
                            view === option.value
                                ? "bg-white/10 text-neutral-100 ring-white/5"
                                : "bg-white/[0.025] text-neutral-500 ring-white/7 hover:bg-white/5 hover:text-neutral-300",
                        )}
                    >
                        {option.label}
                    </Button>
                ))}
            </div>
            <MyIssuesControls />
        </div>
    );
}
