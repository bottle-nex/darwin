"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PiArrowRight } from "react-icons/pi";
import { cn } from "@/lib/utils";
import { azeretMono, Button } from "@/components/ui/button";
import Reveal from "@/components/utility/Reveal";

const MICRO_LABELS = ["Reads the repo", "Writes the patch", "Opens the PR"];

export default function LandingHeroV2() {
    return (
        <section className="relative overflow-hidden">
            <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle,#d9d9d9_1px,transparent_1px)] bg-size-[28px_28px] mask-[radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
            />
            {/* <HeroIssueCards /> */}
            <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-8 px-6 pt-28 pb-16 text-center md:pt-36">
                <Reveal immediate>
                    <div
                        className={cn(
                            "flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] uppercase tracking-wide text-neutral-500 shadow-sm",
                            azeretMono.className,
                        )}
                    >
                        <span className="size-1.5 rounded-full bg-[#AB9FF2]" />
                        The agent-native board
                    </div>
                </Reveal>
                <Reveal immediate delay={0.08}>
                    <h1 className="text-5xl font-light leading-[0.95] tracking-tight text-neutral-900 sm:text-7xl md:text-8xl lg:text-9xl">
                        File the issue.
                        <br />
                        <span className="text-neutral-400">Review the PR.</span>
                    </h1>
                </Reveal>
                <Reveal immediate delay={0.16}>
                    <p className="max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
                        Drop an issue on the board and an agent takes it from there — it reads your
                        repo, writes the patch, verifies it on a sandboxed runner, and opens a pull
                        request for your review.
                    </p>
                </Reveal>
                <Reveal immediate delay={0.24}>
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-x-4">
                        <Button size="lg">
                            Get started
                            <PiArrowRight className="h-3 w-3" />
                        </Button>
                        <Button size="lg" variant="secondary" asChild>
                            <Link href="/why" className="uppercase">
                                Why matcha
                                <ArrowRight />
                            </Link>
                        </Button>
                    </div>
                </Reveal>
                <Reveal immediate delay={0.32}>
                    <div
                        className={cn(
                            "flex flex-wrap items-center justify-center gap-3 pt-2 text-[12px] uppercase tracking-wide text-neutral-500 sm:gap-4",
                            azeretMono.className,
                        )}
                    >
                        {MICRO_LABELS.map((label, i) => (
                            <div key={label} className="flex items-center gap-4">
                                {i > 0 && <span className="h-2.5 w-px bg-neutral-300" />}
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
