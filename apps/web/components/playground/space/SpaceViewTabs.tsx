"use client";

import IconWrapper from "@/components/ui/IconWrapper";
import { type SpaceView, useSpaceViewStore } from "@/store/space/useSpaceViewStore";

const TABS: { view: SpaceView; label: string }[] = [
    { view: "overview", label: "Overview" },
    { view: "issues", label: "Issues" },
];

export default function SpaceViewTabs({ spaceId, view }: { spaceId: string; view: SpaceView }) {
    const show = useSpaceViewStore((s) => s.show);

    return (
        <div
            role="tablist"
            aria-label="Space views"
            className="flex items-center gap-1.5 px-4 py-3"
        >
            {TABS.map((tab) => (
                <button
                    key={tab.view}
                    type="button"
                    role="tab"
                    aria-selected={view === tab.view}
                    onClick={() => show(spaceId, tab.view)}
                    className="cursor-pointer"
                >
                    <IconWrapper size="big" variant="ring" active={view === tab.view}>
                        {tab.label}
                    </IconWrapper>
                </button>
            ))}
        </div>
    );
}
