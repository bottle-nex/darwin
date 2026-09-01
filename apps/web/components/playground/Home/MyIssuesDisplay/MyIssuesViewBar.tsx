"use client";

import IconWrapper from "@/components/ui/IconWrapper";
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
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={view === option.value}
                        onClick={() => onViewChange(option.value)}
                        className="cursor-pointer"
                    >
                        <IconWrapper size="big" variant="ring" active={view === option.value}>
                            {option.label}
                        </IconWrapper>
                    </button>
                ))}
            </div>
            <MyIssuesControls />
        </div>
    );
}
