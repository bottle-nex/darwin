import { SettingsTemplatesIcon } from "@trydarwin/ui/icons";

import SettingsHeroCard, {
    HeroButton,
    HeroLabel,
    HeroLine,
    HeroPanel,
    HeroRow,
    HeroTile,
} from "./SettingsHeroCard";

export default function TemplatesSettingsHeroCard() {
    return (
        <SettingsHeroCard>
            <HeroPanel className="-bottom-6 -left-8 w-92 -rotate-6" accent>
                <div className="flex items-center gap-3">
                    <HeroTile icon={SettingsTemplatesIcon} />
                    <span className="text-[13.5px] font-medium text-snow/90">Bug report</span>
                </div>
                <div className="mt-4 flex flex-col gap-2.5">
                    <HeroLine className="w-56 bg-snow/20" />
                    <HeroLine className="w-44" />
                    <HeroLine className="w-48" />
                    <HeroLine className="w-32" />
                </div>
            </HeroPanel>
            <HeroPanel className="-top-3 left-60 w-76 rotate-2">
                <div className="flex flex-col gap-1">
                    <HeroRow icon={SettingsTemplatesIcon} label="Bug report" selected />
                    <HeroRow icon={SettingsTemplatesIcon} label="Feature request" />
                    <HeroRow icon={SettingsTemplatesIcon} label="Chore" />
                </div>
            </HeroPanel>
            <HeroPanel className="top-16 -right-10 w-72 -rotate-2">
                <HeroLabel>Templates</HeroLabel>
                <div className="mt-3 flex items-center justify-between gap-3">
                    <HeroLine className="w-24" />
                    <HeroButton>+ New template</HeroButton>
                </div>
                <div className="mt-4 flex flex-col gap-2.5">
                    <HeroLine className="w-40" />
                    <HeroLine className="w-28" />
                </div>
            </HeroPanel>
        </SettingsHeroCard>
    );
}
