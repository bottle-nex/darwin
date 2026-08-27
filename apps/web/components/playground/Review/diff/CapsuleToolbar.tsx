"use client";
import type { CapsuleControl } from "@trymatcha/types";
import { useState } from "react";
import { IoDesktopOutline } from "react-icons/io5";
import { LuSlidersHorizontal } from "react-icons/lu";
import { MdCompare, MdOutlinePhoneIphone, MdVerticalSplit } from "react-icons/md";

import { BLURRED_BG_TWO } from "@/components/playground/Home/KanbanDisplay/cardStyles";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUserConfig } from "@/hooks/user/useUserConfig";
import { cn } from "@/lib/utils";
import type { CapsuleCompareMode, CapsuleViewport } from "@/types/capsule.type";

import CapsuleControls from "./CapsuleControls";
import SegmentedControl, { type SegmentedOption } from "./SegmentedControl";

const VIEWPORTS: SegmentedOption<CapsuleViewport>[] = [
    { value: "desktop", label: "Desktop", icon: IoDesktopOutline },
    { value: "mobile", label: "Mobile", icon: MdOutlinePhoneIphone },
];

export default function CapsuleToolbar({
    viewport,
    onViewportChange,
    mode,
    onModeChange,
    sliderDisabledReason,
    controls,
    controlValues,
    onControlChange,
}: {
    viewport: CapsuleViewport;
    onViewportChange: (value: CapsuleViewport) => void;
    mode: CapsuleCompareMode;
    onModeChange: (value: CapsuleCompareMode) => void;
    sliderDisabledReason?: string;
    controls: CapsuleControl[];
    controlValues: Record<string, string>;
    onControlChange: (name: string, value: string) => void;
}) {
    const glass = useUserConfig().backgroundLightingEnabled;

    const modes: SegmentedOption<CapsuleCompareMode>[] = [
        { value: "split", label: "Split", icon: MdVerticalSplit },
        { value: "slider", label: "Slider", icon: MdCompare, disabledReason: sliderDisabledReason },
    ];

    return (
        <div
            className={cn(
                "pointer-events-auto flex items-center gap-1 rounded-lg border border-white/5 p-1 shadow-[0_4px_12px_rgba(0,0,0,0.35)]",
                BLURRED_BG_TWO(glass),
            )}
        >
            <SegmentedControl
                name="capsule-viewport"
                label="Device"
                value={viewport}
                options={VIEWPORTS}
                onChange={onViewportChange}
                showLabels={false}
            />
            <span className="h-5 w-px bg-white/5" aria-hidden />
            <SegmentedControl
                name="capsule-mode"
                label="Comparison"
                value={mode}
                options={modes}
                onChange={onModeChange}
            />
            {controls.length > 0 && (
                <>
                    <span className="h-5 w-px bg-white/5" aria-hidden />
                    <PropsMenu
                        controls={controls}
                        values={controlValues}
                        onChange={onControlChange}
                    />
                </>
            )}
        </div>
    );
}

function PropsMenu({
    controls,
    values,
    onChange,
}: {
    controls: CapsuleControl[];
    values: Record<string, string>;
    onChange: (name: string, value: string) => void;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="unstyled"
                    type="button"
                    className={cn(
                        "relative flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-[13.5px] font-medium transition-colors",
                        open
                            ? "border-snow/5 bg-snow/4 text-snow shadow-sm shadow-black/7"
                            : "border-transparent text-neutral-500 hover:text-neutral-300",
                    )}
                >
                    <LuSlidersHorizontal className="size-3.5" aria-hidden />
                    Props
                </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-56 p-2">
                <CapsuleControls controls={controls} values={values} onChange={onChange} />
            </PopoverContent>
        </Popover>
    );
}
