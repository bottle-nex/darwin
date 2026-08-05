import { cn } from "@/lib/utils";
import { JSX } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Integration {
    row: number;
    col: number;
    name: string;
    logo: string;
}

const GRID_ROWS = 5;
const GRID_COLS = 8;

const integrations: Integration[] = [
    { row: 1, col: 4, name: "GitHub", logo: "/images/integrations/github.svg" },
    { row: 1, col: 6, name: "Slack", logo: "/images/integrations/slack.svg" },
    { row: 1, col: 8, name: "Discord", logo: "/images/integrations/discord.svg" },
    { row: 2, col: 3, name: "Linear", logo: "/images/integrations/linear.svg" },
    { row: 2, col: 5, name: "Trello", logo: "/images/integrations/trello.svg" },
    { row: 2, col: 7, name: "WhatsApp", logo: "/images/integrations/whatsapp.svg" },
    { row: 3, col: 6, name: "Jira", logo: "/images/integrations/jira.svg" },
    { row: 3, col: 8, name: "Notion", logo: "/images/integrations/notion.svg" },
    { row: 4, col: 5, name: "GitLab", logo: "/images/integrations/gitlab.svg" },
    { row: 4, col: 7, name: "Figma", logo: "/images/integrations/figma.svg" },
    { row: 5, col: 6, name: "Sentry", logo: "/images/integrations/sentry.svg" },
    { row: 5, col: 8, name: "Vercel", logo: "/images/integrations/vercel.svg" },
];

export default function IntegrationsSection(): JSX.Element {
    return (
        <main className="w-full py-24">
            <section
                className="border-graphite/50 mx-auto grid w-full max-w-7xl overflow-hidden rounded-[20px] border"
                style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
            >
                {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, index) => {
                    const row = Math.floor(index / GRID_COLS) + 1;
                    const col = (index % GRID_COLS) + 1;
                    return (
                        <div
                            key={index}
                            className={cn(
                                "border-graphite/50 aspect-square",
                                col < GRID_COLS && "border-r",
                                row < GRID_ROWS && "border-b",
                            )}
                            style={{ gridRow: row, gridColumn: col }}
                        />
                    );
                })}

                {integrations.map((integration) => (
                    <div
                        key={integration.name}
                        className="p-2"
                        style={{ gridRow: integration.row, gridColumn: integration.col }}
                    >
                        <div className="bg-linear-to-b from-ink/20 via-cement/30 to-graphite/10 border-graphite/50 flex h-full w-full items-center justify-center rounded-xl border">
                            <Image
                                src={integration.logo}
                                alt={integration.name}
                                width={44}
                                height={44}
                                unoptimized
                                className="h-[38%] w-[38%] object-contain"
                            />
                        </div>
                    </div>
                ))}

                <div
                    className="bg-ink flex flex-col justify-center gap-8 p-8"
                    style={{ gridRow: "3 / span 3", gridColumn: "1 / span 4" }}
                >
                    <span className="w-fit rounded-full border border-neutral-800 px-3 py-1 font-mono text-[11px] tracking-widest text-neutral-400 uppercase">
                        Built for teams
                    </span>
                    <h2 className="text-5xl leading-tight tracking-tight text-neutral-100">
                        File the issue.
                        <br />
                        <span className="text-neutral-500">matcha ships the PR.</span>
                    </h2>
                    <Button className="w-fit">
                        Start building
                        <span aria-hidden>&rsaquo;</span>
                    </Button>
                </div>
            </section>
        </main>
    );
}
