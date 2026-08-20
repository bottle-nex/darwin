"use client";
import Link from "next/link";
import { FaXTwitter } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { azeretMono } from "@/lib/fonts";
import Reveal from "@/components/utility/Reveal";
import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import GridBackdrop from "./GridBackdrop";

export default function AboutRevampHero() {
    return (
        <section className="relative min-h-screen overflow-hidden bg-ink">
            <GridBackdrop />

            <div className="relative z-30 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-between px-6 pt-28 pb-12">
                <div className="flex flex-col items-center gap-6 text-center mt-15">
                    <Reveal immediate>
                        <div
                            className={cn(
                                "buddy-zone flex items-center gap-2 rounded-full border border-white/10 bg-charcoal px-3 py-1.5 text-[11px] uppercase tracking-wide text-neutral-400 shadow-sm",
                                azeretMono.className,
                            )}
                        >
                            <HeroBuddy className="size-6 -my-1" />
                            About matcha
                        </div>
                    </Reveal>

                    <Reveal immediate delay={0.08}>
                        <h1 className="mt-2 max-w-4xl text-4xl leading-[1.05] font-light tracking-tight text-neutral-100 sm:text-5xl lg:text-6xl">
                            Software that ships itself.
                            <br />
                            Judgment that stays yours.
                        </h1>
                    </Reveal>

                    <Reveal immediate delay={0.16}>
                        <p className="max-w-md text-sm text-neutral-400 sm:text-base">
                            Matcha turns a Kanban board into a pipeline of pull requests, file the
                            issue, review the diff.
                        </p>
                    </Reveal>

                    <Reveal immediate delay={0.24}>
                        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-x-4">
                            <Button size="lg" variant="secondary" asChild>
                                <Link href="#" className="uppercase">
                                    Connect on
                                    <FaXTwitter className="size-3" />
                                </Link>
                            </Button>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
