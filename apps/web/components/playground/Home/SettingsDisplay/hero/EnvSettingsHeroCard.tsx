import { EnvSecretIcon } from "@trydarwin/ui/icons";

import SettingsHeroCard, {
    HeroButton,
    HeroChip,
    HeroInput,
    HeroLabel,
    HeroPanel,
    HeroTile,
} from "./SettingsHeroCard";

export default function EnvSettingsHeroCard() {
    return (
        <SettingsHeroCard>
            <HeroPanel className="-bottom-6 -left-8 w-100 -rotate-5" accent>
                <div className="flex items-center gap-3">
                    <HeroTile icon={EnvSecretIcon} />
                    <span className="text-[13.5px] font-medium text-overlay/90">
                        Environment variables
                    </span>
                </div>
                <div className="mt-4 flex flex-col gap-3 font-mono text-[12.5px]">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-overlay/80">DATABASE_URL</span>
                        <span className="text-overlay/30">••••••••••••••••</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-overlay/80">RESEND_API_KEY</span>
                        <span className="text-overlay/30">••••••••••</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-overlay/80">SERVER_JWT_SECRET</span>
                        <span className="text-overlay/30">••••••••••••</span>
                    </div>
                </div>
            </HeroPanel>
            <HeroPanel className="-top-3 left-60 w-80 rotate-2">
                <HeroLabel>Add variable</HeroLabel>
                <div className="mt-3 flex gap-2">
                    <HeroInput className="flex-1 font-mono text-overlay/45">KEY</HeroInput>
                    <HeroInput className="flex-1 font-mono text-overlay/45">value</HeroInput>
                </div>
                <div className="mt-3 flex justify-end">
                    <HeroButton>Save</HeroButton>
                </div>
            </HeroPanel>
            <HeroPanel className="top-16 -right-10 w-72 -rotate-2">
                <div className="flex items-center justify-between gap-3 font-mono text-[12.5px]">
                    <span className="text-overlay/80">REDIS_URL</span>
                    <HeroChip>Reveal</HeroChip>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[12.5px]">
                    <span className="text-overlay/80">MINIO_SECRET_KEY</span>
                    <HeroChip>Reveal</HeroChip>
                </div>
            </HeroPanel>
        </SettingsHeroCard>
    );
}
