import { SettingsApiKeysIcon } from "@trymatcha/ui/icons";

import SettingsHeroCard, {
    HeroButton,
    HeroChip,
    HeroInput,
    HeroLabel,
    HeroLine,
    HeroPanel,
    HeroTile,
} from "./SettingsHeroCard";

export default function ApiKeysSettingsHeroCard() {
    return (
        <SettingsHeroCard>
            <HeroPanel className="-bottom-6 -left-8 w-100 -rotate-5" accent>
                <div className="flex items-center gap-3">
                    <HeroTile icon={SettingsApiKeysIcon} />
                    <span className="text-[13.5px] font-medium text-snow/90">API keys</span>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                        <span className="flex flex-col gap-1">
                            <span className="text-[13px] text-snow/80">Nocturn local</span>
                            <span className="font-mono text-[12px] text-snow/35">
                                mch_live_dx5v1xxx••••
                            </span>
                        </span>
                        <HeroChip className="text-rose-300/90">Revoke</HeroChip>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="flex flex-col gap-1">
                            <span className="text-[13px] text-snow/80">Nocturn CI</span>
                            <span className="font-mono text-[12px] text-snow/35">
                                mch_live_dx5v0xxx••••
                            </span>
                        </span>
                        <HeroChip className="text-rose-300/90">Revoke</HeroChip>
                    </div>
                </div>
            </HeroPanel>
            <HeroPanel className="-top-3 left-60 w-80 rotate-2">
                <HeroLabel>New key</HeroLabel>
                <div className="mt-3 flex gap-2">
                    <HeroInput className="flex-1 text-snow/45">e.g. Claude Desktop</HeroInput>
                    <HeroButton>Create key</HeroButton>
                </div>
            </HeroPanel>
            <HeroPanel className="top-16 -right-10 w-76 -rotate-2">
                <HeroLabel>MCP server URL</HeroLabel>
                <div className="mt-2.5 flex items-center justify-between gap-3">
                    <span className="truncate font-mono text-[12px] text-snow/55">
                        localhost:4402/api/v1/mcp
                    </span>
                    <HeroChip>Copy</HeroChip>
                </div>
                <div className="mt-4 flex flex-col gap-2.5">
                    <HeroLine className="w-40" />
                    <HeroLine className="w-24" />
                </div>
            </HeroPanel>
        </SettingsHeroCard>
    );
}
