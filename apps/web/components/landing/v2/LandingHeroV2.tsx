"use client";
import Link from "next/link";
import { MdArrowForward } from "react-icons/md";
import { PiArrowRight } from "react-icons/pi";
import { cn } from "@/lib/utils";
import { azeretMono, Button } from "@/components/ui/button";
import Reveal from "@/components/utility/Reveal";
import Dial from "@/app/landing/dial";
import Gradient from "@/app/landing/gradient";

const MICRO_LABELS = ["Reads the repo", "Writes the patch", "Opens the PR"];

export default function LandingHeroV2() {
    return (
        <section className="bg-snow">
            <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-snow">
                {/* Background — gradient + dials moved from the landing prototype */}
                <Gradient />
                <Dial
                    size={1300}
                    color={"#fafafa"}
                    tick={{
                        size: 73,
                        width: 2,
                        color: "#1a1a1a",
                        opacity: 0.3,
                        count: 100,
                    }}
                    padding={32}
                    className="absolute z-10 -bottom-150 -right-150 opacity-30"
                    shadow={{ blur: 20, color: "#00000025" }}
                    rotation={{
                        angle: 5,
                        interval: 2,
                        direction: "clockwise",
                    }}
                />
                <Dial
                    size={1095}
                    color={"#ab9ff2"}
                    tick={{
                        size: 43,
                        width: 2,
                        color: "#1a1a1a",
                        opacity: 0.3,
                        count: 100,
                    }}
                    className="absolute z-20 -bottom-130 -right-130 opacity-30"
                    shadow={{ blur: 20, color: "#00000025" }}
                    rotation={{
                        angle: 5,
                        interval: 2,
                        direction: "counterclockwise",
                    }}
                />
                <Dial
                    size={900}
                    color={"#ab9ff2"}
                    tick={{
                        size: 0,
                        width: 0,
                        color: "#ababab90",
                        opacity: 0.3,
                        count: 100,
                    }}
                    className="absolute z-30 -bottom-110 -right-110 opacity-30"
                    shadow={{ blur: 20, color: "#00000025" }}
                />

                {/* Soft white glow behind the text — fades out toward the edges */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-40"
                    style={{
                        background:
                            "radial-gradient(45% 40% at 50% 50%, rgba(250,250,250,0.92) 0%, rgba(250,250,250,0.6) 40%, rgba(250,250,250,0) 72%)",
                    }}
                />

                {/* Hero content (kept from the / page) */}
                <div className="relative z-50 mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-7xl flex-col items-center justify-center gap-7 px-6 pt-20 pb-[25vh] text-center">
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
                        <h1 className="text-6xl font-light leading-[0.95] tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl">
                            File the issue.
                            <br />
                            <span className="text-neutral-400">Review the PR.</span>
                        </h1>
                    </Reveal>
                    <Reveal immediate delay={0.16}>
                        <p className="max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
                            Drop an issue on the board and an agent takes it from there — it reads
                            your repo, writes the patch, verifies it on a sandboxed runner, and
                            opens a pull request for your review.
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
            </div>
        </section>
    );
}
