"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { azeretMono, Button } from "@/components/ui/button";
import Reveal from "@/components/utility/Reveal";
import { FolderBox, type BoxFolder } from "./FolderBox";

const heroDrawerFolders: BoxFolder[] = [
    { label: "Backlog", tint: "cement", decay: 0 },
    { label: "Sprint 14", tint: "snow", decay: 0 },
    { label: "Agent queue", tint: "lavender", decay: 0 },
    { label: "In review", tint: "snow", decay: 0 },
    { label: "Done", tint: "cement", decay: 0 },
];

const heroParagraph =
    "Every tracker ends up the same way: a drawer of well-written issues waiting for an engineer with a free afternoon. matcha hands each parked folder to an agent — it claims the card off your board, works the fix inside a sandboxed runner, and refiles the folder as a pull request.";

export function WhyHero() {
    return (
        <section className="relative flex min-h-screen flex-col overflow-hidden bg-ink">
            <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-6 pt-32 text-center">
                <Reveal immediate>
                    <h1 className="text-[clamp(3rem,6.5vw,6rem)] font-extralight leading-[1.02] tracking-tight text-neutral-100">
                        Issues go in.
                        <br />
                        <span className="sm:whitespace-nowrap">
                            <span className="text-primary">Pull requests</span> come out.
                        </span>
                    </h1>
                </Reveal>
                <Reveal immediate delay={0.08}>
                    <p
                        className={cn(
                            "mx-auto mt-10 max-w-2xl text-[11px] leading-relaxed text-neutral-500",
                            azeretMono.className,
                        )}
                    >
                        {heroParagraph}
                    </p>
                </Reveal>
                <Reveal immediate delay={0.16}>
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                        <Button size="sm" asChild>
                            <Link href="/login">Open the board</Link>
                        </Button>
                        <Button size="sm" variant="tertiary" asChild>
                            <Link href="#agents">How it works</Link>
                        </Button>
                    </div>
                </Reveal>
            </div>
            <Reveal immediate delay={0.24} className="mx-auto mt-14 w-full max-w-6xl px-6 -mb-12">
                <FolderBox showBase={false} folders={heroDrawerFolders} raisedIndex={2} />
            </Reveal>
        </section>
    );
}
