"use client";
import { CtaGetStartedIcon, CtaMeetTeamIcon } from "@trydarwin/ui/icons";
import Link from "next/link";

import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import { azeretMono } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";

const LOOP_LABELS = ["File the issue", "Agent ships the patch", "You review the PR"];

export default function CtaSection() {
    const { session } = useUserSessionStore();
    return (
        <section className="pb-14 pt-6">
            <div className="">
                <div className="relative mx-auto max-w-7xl rounded-xl bg-snow pb-50">
                    <div className="px-6 pt-24 text-center">
                        <span
                            className={cn(
                                "buddy-zone mx-auto flex w-fit items-center gap-2 rounded-full border border-neutral-800 bg-ink px-3 py-1.5 text-[11px] uppercase tracking-wide text-neutral-400 shadow-sm",
                                azeretMono.className,
                            )}
                        >
                            <HeroBuddy />
                            Start the loop
                        </span>
                        <h2 className="mt-6 text-4xl font-light leading-[1.08] tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
                            Your backlog,
                            <br />
                            <span className="text-neutral-500">cleared overnight.</span>
                        </h2>
                        <p className="mx-auto mt-5 max-w-md leading-relaxed text-neutral-500">
                            File an issue before you leave. Review the pull request with your
                            coffee.
                        </p>
                    </div>
                    <div
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 flex h-44 flex-col overflow-hidden rounded-b-xl"
                    >
                        <div className="flex-1 bg-[#DFD9FF]" />
                        <div className="flex-1 bg-[#CFC6FF]" />
                        <div className="flex-1 bg-[#BCAFFF]" />
                        <div className="flex-1 bg-[#6C55DE]" />
                    </div>
                    <div className="absolute -bottom-4 left-1/2 z-10 w-[calc(100%-48px)] max-w-2xl -translate-x-1/2">
                        <svg
                            aria-hidden
                            className="absolute -left-6 bottom-4 h-6 w-7"
                            viewBox="0 0 28 24"
                        >
                            <path d="M24 0A24 24 0 0 1 0 24H28V0Z" className="fill-cement" />
                        </svg>
                        <svg
                            aria-hidden
                            className="absolute -right-6 bottom-4 h-6 w-7 -scale-x-100"
                            viewBox="0 0 28 24"
                        >
                            <path d="M24 0A24 24 0 0 1 0 24H28V0Z" className="fill-cement" />
                        </svg>
                        <div className="relative rounded-[30px] bg-ink p-4.5">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Link
                                    href={session ? "/playground" : "/login"}
                                    className="rounded-[14px] bg-snow p-5"
                                >
                                    <CtaGetStartedIcon className="size-5 text-neutral-900" />
                                    <div className="mt-7 text-[15px] font-semibold text-neutral-900">
                                        Get started
                                    </div>
                                    <div className="mt-0.5 text-[13px] text-neutral-500">
                                        File your first issue
                                    </div>
                                </Link>
                                <Link
                                    href="/about"
                                    className="rounded-[14px] bg-primary p-5 transition-colors hover:bg-[#BCAFFF]"
                                >
                                    <CtaMeetTeamIcon className="size-5 text-neutral-900" />
                                    <div className="mt-7 text-[15px] font-semibold text-neutral-900">
                                        Meet the team
                                    </div>
                                    <div className="mt-0.5 text-[13px] text-neutral-700">
                                        The people behind darwin
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div
                className={cn(
                    "flex flex-wrap items-center justify-center gap-3 pt-10 text-[11px] uppercase tracking-wide text-neutral-500 sm:gap-4",
                    azeretMono.className,
                )}
            >
                {LOOP_LABELS.map((label, i) => (
                    <div key={label} className="flex items-center gap-4">
                        {i > 0 && <span className="h-2.5 w-px bg-graphite" />}
                        <span>{label}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
