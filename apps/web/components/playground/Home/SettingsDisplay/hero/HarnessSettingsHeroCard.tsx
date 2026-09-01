import { HarnessIcon } from "@trymatcha/ui/icons";

import SettingsHeroCard, {
    HeroChip,
    HeroInput,
    HeroLabel,
    HeroPanel,
    HeroTile,
} from "./SettingsHeroCard";

export default function HarnessSettingsHeroCard() {
    return (
        <SettingsHeroCard>
            <HeroPanel className="-bottom-6 -left-8 w-92 -rotate-6" accent>
                <div className="flex items-center gap-3">
                    <HeroTile icon={HarnessIcon} />
                    <span className="flex flex-col">
                        <span className="text-[13.5px] font-medium text-snow/90">AI Harness</span>
                        <span className="text-[12px] text-snow/45">
                            Runs inside a sandboxed runner
                        </span>
                    </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-[13px] text-snow/70">Default model</span>
                    <HeroInput className="w-fit gap-2 py-1.5 font-mono text-[12.5px]">
                        claude-sonnet-4.5
                        <span className="text-snow/35">⌄</span>
                    </HeroInput>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-[13px] text-snow/70">Harness</span>
                    <HeroChip>Claude Code</HeroChip>
                </div>
            </HeroPanel>
            <HeroPanel className="-top-3 left-60 w-76 rotate-2">
                <HeroLabel>Default effort</HeroLabel>
                <div className="mt-3 flex gap-2">
                    <HeroChip>Low</HeroChip>
                    <HeroChip>Medium</HeroChip>
                    <HeroChip className="bg-primary/15 text-primary">High</HeroChip>
                </div>
            </HeroPanel>
            <HeroPanel className="top-16 -right-10 w-72 -rotate-2">
                <div className="flex items-center gap-2.5">
                    <span className="size-1.5 rounded-full bg-matcha" />
                    <span className="text-[12.5px] text-snow/70">agent-3 claimed MAT-142</span>
                </div>
                <div className="mt-3 flex items-center gap-2.5">
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span className="text-[12.5px] text-snow/70">agent-1 opened PR #73</span>
                </div>
            </HeroPanel>
        </SettingsHeroCard>
    );
}
