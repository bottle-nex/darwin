"use client";

import { cn } from "@/lib/utils";
import { JSX } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "motion/react";
import HeroBuddy from "./HeroBuddy";

interface Integration {
    row: number;
    col: number;
    name: string;
    logo: string;
    delay: number;
}

const GRID_ROWS = 5;
const GRID_COLS = 8;

const integrations: Integration[] = [
    { row: 1, col: 4, name: "GitHub", logo: "/images/integrations/github.svg", delay: 0.12 },
    { row: 1, col: 6, name: "Slack", logo: "/images/integrations/slack.svg", delay: 0.58 },
    { row: 1, col: 8, name: "Discord", logo: "/images/integrations/discord.svg", delay: 0.31 },
    { row: 2, col: 3, name: "Linear", logo: "/images/integrations/linear.svg", delay: 0.74 },
    { row: 2, col: 5, name: "Trello", logo: "/images/integrations/trello.svg", delay: 0.05 },
    { row: 2, col: 7, name: "WhatsApp", logo: "/images/integrations/whatsapp.svg", delay: 0.46 },
    { row: 3, col: 6, name: "Jira", logo: "/images/integrations/jira.svg", delay: 0.89 },
    { row: 3, col: 8, name: "Notion", logo: "/images/integrations/notion.svg", delay: 0.22 },
    { row: 4, col: 5, name: "GitLab", logo: "/images/integrations/gitlab.svg", delay: 0.67 },
    { row: 4, col: 7, name: "Figma", logo: "/images/integrations/figma.svg", delay: 0.38 },
    { row: 5, col: 6, name: "Sentry", logo: "/images/integrations/sentry.svg", delay: 0.95 },
    { row: 5, col: 8, name: "Vercel", logo: "/images/integrations/vercel.svg", delay: 0.51 },
];

export default function IntegrationsSection(): JSX.Element {
    return (
        <main className="w-full py-24">
            <section
                className="mx-auto grid w-full max-w-7xl overflow-hidden rounded-[20px] border border-neutral-200"
                style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
            >
                {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, index) => {
                    const row = Math.floor(index / GRID_COLS) + 1;
                    const col = (index % GRID_COLS) + 1;
                    return (
                        <div
                            key={index}
                            className={cn(
                                "aspect-square border-neutral-200",
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
                        <motion.div
                            className="bg-linear-to-b from-snow to-mist flex h-full w-full origin-center items-center justify-center rounded-xl border border-neutral-200 shadow-sm shadow-black/5"
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true, amount: 0.4 }}
                            transition={{
                                type: "spring",
                                bounce: 0.25,
                                duration: 0.55,
                                delay: integration.delay,
                            }}
                        >
                            <Image
                                src={integration.logo}
                                alt={integration.name}
                                width={44}
                                height={44}
                                unoptimized
                                className="h-[38%] w-[38%] object-contain"
                            />
                        </motion.div>
                    </div>
                ))}

                <div
                    className="bg-snow flex flex-col justify-center gap-8 border-r border-neutral-200 p-8"
                    style={{ gridRow: "3 / span 3", gridColumn: "1 / span 4" }}
                >
                    <span className="w-fit rounded-full border border-neutral-800 px-3 py-1 font-mono text-[11px] tracking-widest text-neutral-400 uppercase flex items-center gap-x-2">
                        <HeroBuddy className="size-3" move={false} />
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
