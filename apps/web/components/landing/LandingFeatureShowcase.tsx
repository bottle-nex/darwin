"use client";
import { CtaArrowIcon } from "@trymatcha/ui/icons";
import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import Reveal from "../utility/Reveal";
import LandingSection from "./LandingSection";
import SectionHeader from "./SectionHeader";
import AgentShowcase from "./showcase/AgentShowcase";
import BoardShowcase from "./showcase/BoardShowcase";
import PullRequestShowcase from "./showcase/PullRequestShowcase";

const FEATURES = [
    {
        index: "1.0",
        nav: "One board for every repo",
        heading: "File issues on a shared board",
        description:
            "Every project gets a board the whole team can drop issues onto. Each card is scoped to a repo, so an agent always knows exactly where to work.",
        Panel: BoardShowcase,
        lazy: false,
    },
    {
        index: "1.1",
        nav: "Agents that work autonomously",
        heading: "An agent claims it and gets to work",
        description:
            "The agent reads the issue, spins your repo up in a sandboxed runner, and iterates until the build and tests pass — no babysitting required.",
        Panel: AgentShowcase,
        lazy: true,
    },
    {
        index: "1.2",
        nav: "Pull requests, not prompts",
        heading: "A finished PR comes back for review",
        description:
            "You never review plans or prompts. A tested pull request lands back on your repo — read the diff, request changes, or merge.",
        Panel: PullRequestShowcase,
        lazy: true,
    },
];

/** Defers mounting shader-backed panels until they're within `margin` of the viewport, so their WebGL/image work doesn't compete with entry animations on first load. */
function LazyPanel({ lazy, children }: { lazy: boolean; children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "600px" });

    if (!lazy) return <>{children}</>;
    return <div ref={ref}>{inView && children}</div>;
}

export default function LandingFeatureShowcase() {
    const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [active, setActive] = useState(0);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActive(Number((entry.target as HTMLElement).dataset.index));
                    }
                }
            },
            { rootMargin: "-45% 0px -45% 0px" },
        );
        panelRefs.current.forEach((panel) => panel && observer.observe(panel));
        return () => observer.disconnect();
    }, []);

    return (
        <LandingSection>
            <SectionHeader
                title="Point it at your repo."
                titleContinued="matcha runs the rest of the loop."
                description="One GitHub connection powers everything, issues on a board, agents in sandboxed runners, pull requests back to you."
            />
            <div className="mt-16 grid gap-12 md:grid-cols-[300px_minmax(0,1fr)] md:gap-16">
                <div className="hidden md:block">
                    <nav className="sticky top-28 flex flex-col gap-1">
                        {FEATURES.map((feature, i) => (
                            <button
                                key={feature.index}
                                type="button"
                                onClick={() =>
                                    panelRefs.current[i]?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                    })
                                }
                                className={cn(
                                    "group/nav flex items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors duration-300",
                                    active === i
                                        ? "text-snow"
                                        : "text-neutral-500 hover:text-neutral-300",
                                )}
                            >
                                <span className="font-mono text-xs">{feature.index}</span>
                                <span className="text-sm">{feature.nav}</span>
                                <CtaArrowIcon
                                    className={cn(
                                        "size-3.5 transition-all duration-300",
                                        active === i
                                            ? "translate-x-0 opacity-100"
                                            : "-translate-x-1 opacity-0",
                                    )}
                                />
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="flex flex-col gap-20 md:gap-28">
                    {FEATURES.map((feature, i) => (
                        <div
                            key={feature.index}
                            data-index={i}
                            ref={(el) => {
                                panelRefs.current[i] = el;
                            }}
                        >
                            <Reveal>
                                <LazyPanel lazy={feature.lazy}>
                                    <feature.Panel />
                                </LazyPanel>
                            </Reveal>
                            <Reveal delay={0.1}>
                                <div className="mt-6">
                                    <h3 className="text-lg text-snow md:text-xl">
                                        {feature.heading}
                                    </h3>
                                    <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-neutral-500 md:text-base">
                                        {feature.description}
                                    </p>
                                </div>
                            </Reveal>
                        </div>
                    ))}
                </div>
            </div>
        </LandingSection>
    );
}
