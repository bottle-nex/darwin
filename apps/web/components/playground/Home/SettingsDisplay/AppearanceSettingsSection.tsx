"use client";
import type { BackgroundLightingColor } from "@trymatcha/types";
import { useParams } from "next/navigation";
import { Slider } from "radix-ui";

import {
    DEFAULT_HOME_VIEW_OPTIONS,
    defaultHomeViewToTab,
    type PlaygroundTab,
    tabToDefaultHomeView,
} from "@/components/playground/playgroundTabs";
import SelectField from "@/components/ui/SelectField";
import { Switch } from "@/components/ui/switch";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useUpdateUserConfig } from "@/hooks/user/useUpdateUserConfig";
import {
    BACKGROUND_LIGHTING_COLORS,
    BACKGROUND_LIGHTING_PRESETS,
    DEFAULT_USER_CONFIG,
} from "@/lib/backgroundLighting";
import { cn } from "@/lib/utils";
import { useBackgroundLightingStore } from "@/store/playground/useBackgroundLightingStore";

import SettingsRow, { SETTINGS_CONTROL_WIDTH } from "./SettingsRow";
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
        <div className="flex flex-col gap-12">
            <SettingsUtilityCard title="Preferences" rows>
                <SettingsRow
                    label="Default home view"
                    description="The view a project opens on when you don't link to a specific tab."
                >
                    <SelectField
                        aria-label="Default home view"
                        className="w-40"
                        value={defaultHomeViewToTab(config.defaultHomeView)}
                        onChange={(tab) => {
                            const view = tabToDefaultHomeView(tab as PlaygroundTab);
                            if (view) updateConfig.mutate({ defaultHomeView: view });
                        }}
                        options={DEFAULT_HOME_VIEW_OPTIONS.map((option) => ({
                            value: option.tab,
                            label: option.label,
                        }))}
                    />
                </SettingsRow>

                <SettingsRow
                    label="Background lighting"
                    description="An ambient glow behind the workspace. Follows your account, not this project."
                >
                    <Switch
                        checked={enabled}
                        onCheckedChange={(backgroundLightingEnabled) =>
                            updateConfig.mutate({ backgroundLightingEnabled })
                        }
                        aria-label="Enable background lighting"
                    />
                </SettingsRow>
            </SettingsUtilityCard>

            <SettingsUtilityCard
                title="Color & direction"
                className={cn(!enabled && "pointer-events-none opacity-50")}
                rows
            >
                <SettingsRow label="Color" description="The hue the glow is tinted with.">
                    <div className="flex flex-wrap items-start justify-end gap-x-6 gap-y-4">
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
                </SettingsRow>

                <SettingsRow label="Direction" description={`Sweep angle — ${angle}°.`}>
                    <Slider.Root
                        value={[angle]}
                        min={0}
                        max={360}
                        step={1}
                        disabled={!enabled}
                        onValueChange={([nextAngle]) => setAngle(nextAngle)}
                        className={cn(
                            SETTINGS_CONTROL_WIDTH,
                            "relative flex h-5 touch-none items-center select-none",
                        )}
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
                </SettingsRow>
            </SettingsUtilityCard>
        </div>
    );
}
