"use client";
import { cn } from "@/lib/utils";
import { azeretMono } from "@/components/ui/button";
import Eyebrow from "./Eyebrow";
import Reveal from "@/components/utility/Reveal";
import FloatingIssueCards from "./FloatingIssueCards";

const MICRO_LABELS = ["Board in", "PRs out", "You review"];

export default function AboutHero() {
    return (
        <section className="relative">
            <div className="mx-auto grid min-h-[85vh] w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 py-24 lg:grid-cols-12">
                <div className="flex flex-col gap-7 lg:col-span-7">
                    <Reveal immediate>
                        <Eyebrow text="About matcha" />
                    </Reveal>
                    <Reveal immediate delay={0.08}>
                        <h1 className="text-left text-6xl font-light leading-[0.95] text-neutral-900 md:text-7xl">
                            Software that ships itself. Judgment that stays yours.
                        </h1>
                    </Reveal>
                    <Reveal immediate delay={0.16}>
                        <p className="max-w-xl text-left text-lg leading-relaxed text-neutral-600">
                            matcha turns a Kanban board into a pipeline of pull requests. File the
                            issue, an agent does the work in a sandboxed runner, and you review the
                            diff. We&apos;re the small team behind that loop.
                        </p>
                    </Reveal>
                    <Reveal immediate delay={0.24}>
                        <div
                            className={cn(
                                "flex items-center gap-4 pt-4 text-[12px] uppercase tracking-wide text-neutral-500",
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
                <div className="hidden lg:col-span-5 lg:block">
                    <FloatingIssueCards />
                </div>
            </div>
            <div className="border-t border-neutral-200">
                <div
                    className={cn(
                        "mx-auto flex max-w-7xl justify-end px-6 py-3 text-[11px] uppercase tracking-wide text-neutral-400",
                        azeretMono.className,
                    )}
                >
                    Founded 2025 · Built by three engineers
                </div>
            </div>
        </section>
    );
}
