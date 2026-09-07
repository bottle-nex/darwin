import {
    DiscordLogoIcon,
    GithubLogoIcon,
    JiraLogoIcon,
    LinearLogoIcon,
    NotionLogoIcon,
    SlackLogoIcon,
} from "@trymatcha/ui/icons";

import { AppLogo } from "@/components/logo/AppLogo";

import SettingsHeroCard from "./SettingsHeroCard";

const INTEGRATION_APPS = [
    { icon: GithubLogoIcon, color: "#e8e8e8" },
    { icon: SlackLogoIcon, color: "#e01e5a" },
    { icon: LinearLogoIcon, color: "#8b93ff" },
    { icon: JiraLogoIcon, color: "#4d9fff" },
    { icon: NotionLogoIcon, color: "#ffffff" },
    { icon: DiscordLogoIcon, color: "#5865f2" },
];

const BACKDROP_BLOCKS = [
    { top: "14%", left: "83%", width: 10, opacity: 0.021 },
    { top: "24%", left: "30%", width: 12, opacity: 0.033 },
    { top: "20%", left: "33%", width: 10, opacity: 0.031 },
    { top: "28%", left: "5%", width: 12, opacity: 0.034 },
    { top: "32%", left: "13%", width: 26, opacity: 0.029 },
    { top: "32%", left: "29%", width: 20, opacity: 0.029 },
    { top: "37%", left: "2%", width: 20, opacity: 0.036 },
    { top: "38%", left: "22%", width: 12, opacity: 0.048 },
    { top: "36%", left: "37%", width: 10, opacity: 0.031 },
    { top: "40%", left: "91%", width: 16, opacity: 0.046 },
    { top: "48%", left: "7%", width: 10, opacity: 0.047 },
    { top: "44%", left: "17%", width: 16, opacity: 0.048 },
    { top: "46%", left: "35%", width: 10, opacity: 0.05 },
    { top: "44%", left: "50%", width: 10, opacity: 0.054 },
    { top: "46%", left: "60%", width: 20, opacity: 0.041 },
    { top: "45%", left: "70%", width: 12, opacity: 0.043 },
    { top: "56%", left: "2%", width: 16, opacity: 0.067 },
    { top: "52%", left: "7%", width: 12, opacity: 0.059 },
    { top: "54%", left: "16%", width: 12, opacity: 0.063 },
    { top: "53%", left: "22%", width: 20, opacity: 0.048 },
    { top: "54%", left: "31%", width: 26, opacity: 0.064 },
    { top: "55%", left: "37%", width: 12, opacity: 0.058 },
    { top: "54%", left: "43%", width: 32, opacity: 0.053 },
    { top: "56%", left: "51%", width: 12, opacity: 0.047 },
    { top: "60%", left: "4%", width: 10, opacity: 0.072 },
    { top: "63%", left: "11%", width: 12, opacity: 0.067 },
    { top: "63%", left: "20%", width: 26, opacity: 0.05 },
    { top: "64%", left: "28%", width: 26, opacity: 0.079 },
    { top: "60%", left: "37%", width: 16, opacity: 0.078 },
    { top: "64%", left: "45%", width: 32, opacity: 0.07 },
    { top: "62%", left: "52%", width: 16, opacity: 0.072 },
    { top: "61%", left: "58%", width: 10, opacity: 0.057 },
    { top: "62%", left: "64%", width: 20, opacity: 0.048 },
    { top: "64%", left: "73%", width: 26, opacity: 0.072 },
    { top: "70%", left: "0%", width: 20, opacity: 0.056 },
    { top: "69%", left: "7%", width: 16, opacity: 0.064 },
    { top: "68%", left: "16%", width: 26, opacity: 0.091 },
    { top: "68%", left: "25%", width: 32, opacity: 0.073 },
    { top: "69%", left: "31%", width: 26, opacity: 0.084 },
    { top: "72%", left: "37%", width: 32, opacity: 0.073 },
    { top: "72%", left: "44%", width: 12, opacity: 0.065 },
    { top: "72%", left: "50%", width: 20, opacity: 0.091 },
    { top: "70%", left: "59%", width: 32, opacity: 0.081 },
    { top: "70%", left: "68%", width: 20, opacity: 0.092 },
    { top: "71%", left: "73%", width: 20, opacity: 0.089 },
    { top: "68%", left: "82%", width: 10, opacity: 0.065 },
    { top: "79%", left: "2%", width: 26, opacity: 0.075 },
    { top: "80%", left: "7%", width: 12, opacity: 0.088 },
    { top: "79%", left: "16%", width: 26, opacity: 0.085 },
    { top: "76%", left: "25%", width: 20, opacity: 0.073 },
    { top: "79%", left: "31%", width: 32, opacity: 0.083 },
    { top: "76%", left: "40%", width: 20, opacity: 0.084 },
    { top: "76%", left: "46%", width: 32, opacity: 0.092 },
    { top: "78%", left: "51%", width: 10, opacity: 0.082 },
    { top: "77%", left: "56%", width: 10, opacity: 0.075 },
    { top: "79%", left: "61%", width: 26, opacity: 0.084 },
    { top: "77%", left: "67%", width: 12, opacity: 0.076 },
    { top: "80%", left: "72%", width: 10, opacity: 0.083 },
    { top: "80%", left: "77%", width: 10, opacity: 0.067 },
    { top: "77%", left: "84%", width: 10, opacity: 0.106 },
    { top: "88%", left: "1%", width: 32, opacity: 0.122 },
    { top: "85%", left: "9%", width: 32, opacity: 0.11 },
    { top: "84%", left: "17%", width: 12, opacity: 0.089 },
    { top: "84%", left: "25%", width: 26, opacity: 0.111 },
    { top: "84%", left: "31%", width: 32, opacity: 0.09 },
    { top: "88%", left: "39%", width: 26, opacity: 0.098 },
    { top: "88%", left: "44%", width: 12, opacity: 0.077 },
    { top: "84%", left: "50%", width: 10, opacity: 0.116 },
    { top: "85%", left: "58%", width: 26, opacity: 0.078 },
    { top: "88%", left: "63%", width: 20, opacity: 0.08 },
    { top: "84%", left: "71%", width: 12, opacity: 0.103 },
    { top: "88%", left: "78%", width: 26, opacity: 0.078 },
    { top: "86%", left: "86%", width: 26, opacity: 0.1 },
    { top: "86%", left: "93%", width: 12, opacity: 0.107 },
    { top: "93%", left: "1%", width: 12, opacity: 0.114 },
    { top: "93%", left: "8%", width: 16, opacity: 0.135 },
    { top: "95%", left: "16%", width: 16, opacity: 0.101 },
    { top: "96%", left: "22%", width: 26, opacity: 0.125 },
    { top: "96%", left: "29%", width: 32, opacity: 0.115 },
    { top: "92%", left: "37%", width: 16, opacity: 0.138 },
    { top: "92%", left: "44%", width: 12, opacity: 0.1 },
    { top: "94%", left: "49%", width: 32, opacity: 0.116 },
    { top: "94%", left: "54%", width: 16, opacity: 0.119 },
    { top: "94%", left: "62%", width: 12, opacity: 0.124 },
    { top: "92%", left: "71%", width: 26, opacity: 0.113 },
    { top: "94%", left: "80%", width: 10, opacity: 0.121 },
    { top: "93%", left: "85%", width: 10, opacity: 0.085 },
    { top: "93%", left: "90%", width: 32, opacity: 0.141 },
];

export default function IntegrationsSettingsHeroCard() {
    return (
        <SettingsHeroCard>
            <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.5)_0%,black_60%,transparent_97%)]">
                {BACKDROP_BLOCKS.map((block, index) => (
                    <span
                        key={index}
                        className="absolute h-1 rounded-[2px] bg-snow/40"
                        style={{
                            top: block.top,
                            left: block.left,
                            width: block.width,
                            opacity: block.opacity,
                        }}
                    />
                ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center [mask-image:linear-gradient(to_bottom,transparent_8%,black_42%,black_58%,transparent_92%)]">
                <AppLogo
                    className="h-44 w-auto text-snow/5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={10}
                />
            </div>
            <div className="absolute inset-0 flex items-center justify-center gap-10">
                {INTEGRATION_APPS.map(({ icon: Icon, color }, index) => (
                    <Icon key={index} className="size-8 shrink-0" style={{ color }} />
                ))}
            </div>
        </SettingsHeroCard>
    );
}
