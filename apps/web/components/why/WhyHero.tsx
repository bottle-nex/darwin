"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { azeretMono, Button } from "@/components/ui/button";
import Reveal from "@/components/utility/Reveal";
import { FolderBox, type BoxFolder } from "./FolderBox";

const heroDrawerFolders: BoxFolder[] = [
    { label: "BACKLOG", tint: "cement", decay: 0 },
    { label: "SPRINT 14", tint: "snow", decay: 0 },
    { label: "AGENT QUEUE", tint: "lavender", decay: 0 },
    { label: "IN REVIEW", tint: "snow", decay: 0 },
    { label: "DONE", tint: "cement", decay: 0 },
];

const heroParagraph =
    "Every tracker ends up the same way: a drawer of well-written issues waiting for an engineer with a free afternoon. matcha hands each parked folder to an agent — it claims the card off your board, works the fix inside a sandboxed runner, and refiles the folder as a pull request.";

export function WhyHero() {
    return (
        <section className="relative flex min-h-screen flex-col overflow-hidden border-b border-white/10 bg-ink">
            <div
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-1/2 h-[320px] w-[720px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(171,159,242,0.2)_1px,transparent_1.5px)] bg-[size:10px_10px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
            />
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
                        <Button size="lg" asChild>
                            <Link href="/login">Open the board</Link>
                        </Button>
                        <Button size="lg" variant="tertiary" asChild>
                            <Link href="#agents">How it works</Link>
                        </Button>
                    </div>
                </Reveal>
            </div>
            <Reveal immediate delay={0.24} className="mx-auto mt-14 w-full max-w-6xl px-6">
                <FolderBox folders={heroDrawerFolders} raisedIndex={2} />
            </Reveal>
        </section>
    );
}
