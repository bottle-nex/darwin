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

function ColorOption({ label, rgb }: { label: string; rgb: string }) {
    return (
        <span className="flex items-center gap-2.5">
            <span
                className="h-6 w-10 shrink-0 overflow-hidden rounded-[5px] p-1.5 ring-1 ring-snow/10 ring-inset"
                style={{
                    background: `linear-gradient(135deg, rgba(${rgb}, 0.25), transparent 70%), var(--color-charcoal)`,
                }}
            >
                <span className="block h-[3px] w-4 rounded-full bg-snow/30" />
                <span className="mt-1 block h-[3px] w-2.5 rounded-full bg-snow/15" />
            </span>
            {label}
        </span>
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
                    <SelectField
                        aria-label="Background lighting color"
                        className="w-40 pl-1"
                        itemClassName="pl-1"
                        disabled={!enabled}
                        value={config.backgroundLightingColor}
                        onChange={(color) =>
                            updateConfig.mutate({
                                backgroundLightingColor: color as BackgroundLightingColor,
                            })
                        }
                        options={BACKGROUND_LIGHTING_COLORS.map((color) => ({
                            value: color,
                            label: <ColorOption {...BACKGROUND_LIGHTING_PRESETS[color]} />,
                        }))}
                    />
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
