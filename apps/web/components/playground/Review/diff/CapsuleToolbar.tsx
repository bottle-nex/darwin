"use client";
import { MdCompare, MdDesktopWindows, MdSmartphone, MdVerticalSplit } from "react-icons/md";

import { BLURRED_BG_TWO } from "@/components/playground/Home/KanbanDisplay/cardStyles";
import { useUserConfig } from "@/hooks/user/useUserConfig";
import { cn } from "@/lib/utils";
import type { CapsuleCompareMode, CapsuleViewport } from "@/types/capsule.type";

import SegmentedControl, { type SegmentedOption } from "./SegmentedControl";

const VIEWPORTS: SegmentedOption<CapsuleViewport>[] = [
    { value: "desktop", label: "Desktop", icon: MdDesktopWindows },
    { value: "mobile", label: "Mobile", icon: MdSmartphone },
];

export default function CapsuleToolbar({
    viewport,
    onViewportChange,
    mode,
    onModeChange,
    sliderDisabledReason,
}: {
    viewport: CapsuleViewport;
    onViewportChange: (value: CapsuleViewport) => void;
    mode: CapsuleCompareMode;
    onModeChange: (value: CapsuleCompareMode) => void;
    sliderDisabledReason?: string;
}) {
    const glass = useUserConfig().backgroundLightingEnabled;

    const modes: SegmentedOption<CapsuleCompareMode>[] = [
        { value: "split", label: "Split", icon: MdVerticalSplit },
        { value: "slider", label: "Slider", icon: MdCompare, disabledReason: sliderDisabledReason },
    ];

    return (
        <div
            className={cn(
                "pointer-events-auto flex items-center gap-1 rounded-full border border-white/5 p-1 shadow-[0_4px_12px_rgba(0,0,0,0.35)]",
                BLURRED_BG_TWO(glass),
            )}
        >
            <SegmentedControl
                name="capsule-viewport"
                label="Device"
                value={viewport}
                options={VIEWPORTS}
                onChange={onViewportChange}
            />
            <span className="h-5 w-px bg-white/5" aria-hidden />
            <SegmentedControl
                name="capsule-mode"
                label="Comparison"
                value={mode}
                options={modes}
                onChange={onModeChange}
            />
        </div>
    );
}
