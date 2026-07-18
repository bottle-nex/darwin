"use client";
import Link from "next/link";
import { MdArrowForward } from "react-icons/md";
import { PiArrowRight } from "react-icons/pi";
import { cn } from "@/lib/utils";
import { azeretMono, Button } from "@/components/ui/button";
import Reveal from "@/components/utility/Reveal";
import HeroBuddy from "@/components/landing/v2/HeroBuddy";

const MICRO_LABELS = ["Reads the repo", "Writes the patch", "Opens the PR"];

export default function LandingHeroV2() {
    return (
        <section className="bg-cement">
            <div className="relative -mt-24 min-h-screen overflow-hidden bg-cement">
                <div className="relative z-50 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center gap-7 px-6 pt-34 pb-[25vh] text-center">
                    <Reveal immediate>
                        <div
                            className={cn(
                                "buddy-zone flex items-center gap-2 rounded-full border border-neutral-800 bg-charcoal px-3 py-1.5 text-[11px] uppercase tracking-wide text-neutral-400 shadow-sm",
                                azeretMono.className,
                            )}
                        >
                            <HeroBuddy className="size-6 -my-1" />
                            The agent-native board
                        </div>
                    </Reveal>
                    <Reveal immediate delay={0.08}>
                        <h1 className="text-6xl font-light leading-[0.95] tracking-tight text-neutral-100 sm:text-7xl lg:text-8xl">
                            File the issue.
                            <br />
                            <span className="text-neutral-400">Review the PR.</span>
                        </h1>
                    </Reveal>
                    <Reveal immediate delay={0.16}>
                        <p className="max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg">
                            Drop an issue on the board and an agent takes it from there — it reads
                            your repo, writes the patch, verifies it on a sandboxed runner, and
                            {/* opens a pull request for your review. */}
                        </p>
                    </Reveal>
                    <Reveal immediate delay={0.24}>
                        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-x-4">
                            <Button size="lg" variant="secondary">
                                Get started
                                <PiArrowRight className="h-3 w-3" />
                            </Button>
                            <Button size="lg" asChild>
                                <Link href="/why" className="uppercase">
                                    Why matcha
                                    <MdArrowForward />
                                </Link>
                            </Button>
                        </div>
                    </Reveal>
                    <Reveal immediate delay={0.32}>
                        <div
                            className={cn(
                                "flex flex-wrap items-center justify-center gap-3 pt-2 text-[12px] uppercase tracking-wide text-neutral-400 sm:gap-4",
                                azeretMono.className,
                            )}
                        >
                            {MICRO_LABELS.map((label, i) => (
                                <div key={label} className="flex items-center gap-4">
                                    {i > 0 && <span className="h-2.5 w-px bg-neutral-700" />}
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
