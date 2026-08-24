"use client";
import { BackgroundLightingColor } from "@trymatcha/types";
import { Slider } from "radix-ui";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useUpdateUserConfig } from "@/hooks/user/useUpdateUserConfig";
import { useBackgroundLightingStore } from "@/store/playground/useBackgroundLightingStore";
import {
    BACKGROUND_LIGHTING_COLORS,
    BACKGROUND_LIGHTING_PRESETS,
    DEFAULT_USER_CONFIG,
} from "@/lib/backgroundLighting";
import { useParams } from "next/navigation";
import SettingsUtilityCard from "./SettingsUtilityCard";

function ColorSwatch({
    color,
    checked,
    disabled,
    onSelect,
}: {
    color: BackgroundLightingColor;
    checked: boolean;
    disabled: boolean;
    onSelect: () => void;
}) {
    const { label, rgb } = BACKGROUND_LIGHTING_PRESETS[color];

    return (
        <label
            className={cn(
                "flex flex-col items-center gap-2",
                disabled ? "cursor-not-allowed" : "cursor-pointer",
            )}
        >
            <input
                type="radio"
                name="background-lighting-color"
                className="sr-only"
                value={color}
                checked={checked}
                disabled={disabled}
                onChange={onSelect}
            />
            <span
                className="size-8 rounded-full transition-transform hover:scale-105"
                style={{
                    background: `radial-gradient(circle at 50% 35%, rgba(${rgb}, 0.95), rgba(${rgb}, 0.3))`,
                    outline: checked ? `1.5px solid rgba(${rgb}, 0.9)` : undefined,
                    outlineOffset: 3,
                    boxShadow: checked ? `0 0 14px rgba(${rgb}, 0.35)` : undefined,
                }}
            />
            <span
                className={cn(
                    "text-[11px] transition-colors",
                    checked ? "text-neutral-100" : "text-neutral-500",
                )}
            >
                {label}
            </span>
        </label>
    );
}

export default function AppearanceSettingsSection() {
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const config = dashboard?.userConfig ?? DEFAULT_USER_CONFIG;
    const updateConfig = useUpdateUserConfig();

    const angle = useBackgroundLightingStore((state) => state.angle);
    const setAngle = useBackgroundLightingStore((state) => state.setAngle);

    const enabled = config.backgroundLightingEnabled;

    return (
        <div className="flex flex-col gap-4">
            <SettingsUtilityCard
                title="Background lighting"
                description="An ambient glow behind the workspace. These settings follow your account, not this project."
            >
                <div className="flex items-center justify-between gap-4">
                    <span className="text-[13px] text-neutral-300">Enable</span>
                    <Switch
                        checked={enabled}
                        onCheckedChange={(backgroundLightingEnabled) =>
                            updateConfig.mutate({ backgroundLightingEnabled })
                        }
                        aria-label="Enable background lighting"
                    />
                </div>
            </SettingsUtilityCard>

            <SettingsUtilityCard
                title="Color & direction"
                description="Choose a hue and sweep angle for the glow."
                className={cn(!enabled && "pointer-events-none opacity-50")}
            >
                <div>
                    <span className="text-[12px] text-neutral-300">Color</span>
                    <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-4">
                        {BACKGROUND_LIGHTING_COLORS.map((color) => (
                            <ColorSwatch
                                key={color}
                                color={color}
                                checked={config.backgroundLightingColor === color}
                                disabled={!enabled}
                                onSelect={() =>
                                    updateConfig.mutate({ backgroundLightingColor: color })
                                }
                            />
                        ))}
                    </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-[12px] text-neutral-300">Direction</span>
                        <span className="text-[11px] text-neutral-500 tabular-nums">{angle}°</span>
                    </div>
                    <Slider.Root
                        value={[angle]}
                        min={0}
                        max={360}
                        step={1}
                        disabled={!enabled}
                        onValueChange={([nextAngle]) => setAngle(nextAngle)}
                        className="relative mt-2.5 flex h-5 w-full touch-none items-center select-none"
                    >
                        <Slider.Track className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/8">
                            <Slider.Range className="absolute h-full bg-white/25" />
                        </Slider.Track>
                        <Slider.Thumb
                            aria-label="Background lighting direction"
                            aria-valuetext={`${angle} degrees`}
                            className="block size-3 cursor-grab rounded-full bg-white shadow-[0_1px_5px_rgba(0,0,0,0.55)] outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary/50 active:cursor-grabbing"
                        />
                    </Slider.Root>
                </div>
            </SettingsUtilityCard>
        </div>
    );
}
