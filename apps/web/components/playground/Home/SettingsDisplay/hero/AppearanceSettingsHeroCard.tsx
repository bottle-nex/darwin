import { CheckIcon } from "@trydarwin/ui/icons";

import { cn } from "@/lib/utils";

import SettingsHeroCard, {
    HeroChip,
    HeroLabel,
    HeroLine,
    HeroPanel,
    HeroSwitch,
} from "./SettingsHeroCard";

const GLOWS = [
    { rgb: "132, 114, 245", label: "Violet", selected: true },
    { rgb: "155, 194, 79", label: "Darwin", selected: false },
    { rgb: "96, 165, 250", label: "Blue", selected: false },
];

export default function AppearanceSettingsHeroCard() {
    return (
        <SettingsHeroCard>
            <HeroPanel className="-bottom-6 -left-8 w-104 -rotate-5" accent>
                <HeroLabel>Color</HeroLabel>
                <div className="mt-3 flex gap-3">
                    {GLOWS.map(({ rgb, label, selected }) => (
                        <div
                            key={label}
                            className={cn(
                                "flex-1 rounded-xl border p-3",
                                selected ? "border-primary/60" : "border-snow/10",
                            )}
                            style={{
                                background: `linear-gradient(135deg, rgba(${rgb}, 0.3), transparent 75%), var(--color-charcoal)`,
                            }}
                        >
                            <HeroLine className="w-12 bg-snow/25" />
                            <div className="mt-3 flex items-center justify-between gap-2">
                                <span className="text-[12px] text-snow/70">{label}</span>
                                {selected && <CheckIcon className="size-3.5 text-primary" />}
                            </div>
                        </div>
                    ))}
                </div>
            </HeroPanel>
            <HeroPanel className="-top-3 left-60 w-76 rotate-2">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-snow/80">Background lighting</span>
                    <HeroSwitch on />
                </div>
                <div className="mt-3.5">
                    <HeroLabel>Direction</HeroLabel>
                    <div className="relative mt-2.5 h-1 rounded-full bg-snow/10">
                        <span className="absolute left-0 h-full w-3/5 rounded-full bg-snow/30" />
                        <span className="absolute top-1/2 left-3/5 size-3 -translate-y-1/2 rounded-full bg-snow shadow" />
                    </div>
                </div>
            </HeroPanel>
            <HeroPanel className="top-16 -right-10 w-68 -rotate-2">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-snow/70">Default home view</span>
                    <HeroChip>My issues ⌄</HeroChip>
                </div>
                <div className="mt-4 flex flex-col gap-2.5">
                    <HeroLine className="w-36" />
                    <HeroLine className="w-20" />
                </div>
            </HeroPanel>
        </SettingsHeroCard>
    );
}
