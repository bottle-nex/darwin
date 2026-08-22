"use client";
import { ReviewTab } from "@trymatcha/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";

const TABS: { id: ReviewTab; label: string }[] = [
    { id: ReviewTab.PullRequest, label: "Pull request" },
    { id: ReviewTab.Changes, label: "Changes" },
    { id: ReviewTab.Diff, label: "Diff" },
];

export default function ReviewTabBar({ active }: { active: ReviewTab }) {
    const setReviewTab = usePaneRouteStore((s) => s.setReviewTab);

    return (
        <div role="tablist" className="flex items-center gap-x-2">
            {TABS.map((tab) => (
                <Button
                    key={tab.id}
                    role="tab"
                    variant="unstyled"
                    aria-selected={tab.id === active}
                    onClick={() => setReviewTab(tab.id)}
                    className={cn(
                        "cursor-pointer rounded-full px-2 py-1 text-[12.5px] font-medium transition-colors ring-[0.5px] ring-white/10 hover:bg-white/2",
                        tab.id === active
                            ? "bg-white/5 text-neutral-100"
                            : "text-neutral-500 hover:text-neutral-200",
                    )}
                >
                    {tab.label}
                </Button>
            ))}
        </div>
    );
}
