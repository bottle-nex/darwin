import { SettingsGeneralIcon } from "@trydarwin/ui/icons";

import SettingsHeroCard, {
    HeroChip,
    HeroInput,
    HeroLabel,
    HeroLine,
    HeroPanel,
    HeroSwitch,
    HeroTile,
} from "./SettingsHeroCard";

export default function GeneralSettingsHeroCard() {
    return (
        <SettingsHeroCard>
            <HeroPanel className="-bottom-6 -left-8 w-88 -rotate-6" accent>
                <div className="flex items-center gap-3">
                    <HeroTile icon={SettingsGeneralIcon} />
                    <span className="text-[13.5px] font-medium text-overlay/90">Project</span>
                </div>
                <div className="mt-3.5 flex flex-col gap-2">
                    <HeroInput>Nocturn</HeroInput>
                    <HeroInput className="font-mono text-overlay/55">nocturn</HeroInput>
                </div>
            </HeroPanel>
            <HeroPanel className="-top-3 left-60 w-80 rotate-2">
                <HeroLabel>Options bar</HeroLabel>
                <div className="mt-3 flex gap-2">
                    <HeroChip>Filter</HeroChip>
                    <HeroChip>Focus</HeroChip>
                    <HeroChip>View</HeroChip>
                    <HeroChip className="bg-primary/15 text-primary">+ Add</HeroChip>
                </div>
                <div className="mt-3.5 flex items-center justify-between gap-3">
                    <span className="text-[13px] text-overlay/70">Product Diff</span>
                    <HeroSwitch on />
                </div>
            </HeroPanel>
            <HeroPanel className="top-16 -right-8 w-80 -rotate-2">
                <HeroLabel>Danger zone</HeroLabel>
                <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="flex flex-col gap-1.5">
                        <span className="text-[13px] text-overlay/80">Delete this project</span>
                        <HeroLine className="w-28" />
                    </span>
                    <HeroChip className="bg-brick/50 text-brick-foreground">Delete</HeroChip>
                </div>
                <div className="mt-3.5 flex items-center justify-between gap-3">
                    <span className="text-[13px] text-overlay/70">Transfer ownership</span>
                    <HeroChip>Transfer</HeroChip>
                </div>
            </HeroPanel>
        </SettingsHeroCard>
    );
}
