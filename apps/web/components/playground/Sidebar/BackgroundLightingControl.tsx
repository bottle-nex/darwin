"use client";

import { Slider } from "radix-ui";
import { HiOutlineSun } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { useBackgroundLightingStore } from "@/store/playground/useBackgroundLightingStore";
import { SIDEBAR_ICON_BUTTON_CLASS } from "./shared";

export default function BackgroundLightingControl() {
    const angle = useBackgroundLightingStore((state) => state.angle);
    const setAngle = useBackgroundLightingStore((state) => state.setAngle);

    return (
        <Popover>
            <TooltipComponent content="Background lighting" side="top" delayDuration={500}>
                <PopoverTrigger asChild>
                    <Button
                        variant="unstyled"
                        type="button"
                        aria-label="Adjust background lighting"
                        className={SIDEBAR_ICON_BUTTON_CLASS}
                    >
                        <HiOutlineSun className="size-4" aria-hidden />
                    </Button>
                </PopoverTrigger>
            </TooltipComponent>

            <PopoverContent side="top" align="end" sideOffset={8} className="w-64 p-3">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-medium text-neutral-200">
                        Background lighting
                    </span>
                    <span className="text-[11px] text-neutral-500 tabular-nums">{angle}°</span>
                </div>

                <Slider.Root
                    value={[angle]}
                    min={0}
                    max={360}
                    step={1}
                    onValueChange={([nextAngle]) => setAngle(nextAngle)}
                    className="relative mt-3 flex h-5 w-full touch-none items-center select-none"
                >
                    <Slider.Track className="relative h-1 flex-1 overflow-hidden rounded-full bg-black/70">
                        <Slider.Range className="absolute h-full bg-white/30" />
                    </Slider.Track>
                    <Slider.Thumb
                        aria-label="Background lighting direction"
                        aria-valuetext={`${angle} degrees`}
                        className="block size-3.5 cursor-grab rounded-full bg-white shadow-[0_1px_5px_rgba(0,0,0,0.55)] outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary/50 active:cursor-grabbing"
                    />
                </Slider.Root>

                <p className="mt-2 text-[11px] leading-4 text-neutral-500">
                    Rotate the ambient highlight around the workspace.
                </p>
            </PopoverContent>
        </Popover>
    );
}
