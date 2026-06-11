import {
    Bot,
    GitPullRequest,
    Kanban,
    ScanSearch,
    Server,
    ShieldCheck,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { azeretMono } from "@/components/ui/button";
import Eyebrow from "@/components/about/Eyebrow";
import Reveal from "@/components/utility/Reveal";

type Feature = {
    index: string;
    icon: LucideIcon;
    title: string;
    description: string;
};

const FEATURES: Feature[] = [
    {
        index: "01",
        icon: Kanban,
        title: "The board you already know",
        description:
            "A Kanban canvas your whole team plans on — except the assignees are agents and the columns drain themselves.",
    },
    {
        index: "02",
        icon: ScanSearch,
        title: "Reads the repo first",
        description:
            "Before touching a line, the agent builds context: your conventions, your structure, the blast radius of the change.",
    },
    {
        index: "03",
        icon: Server,
        title: "Sandboxed code runners",
        description:
            "Every change is made on ephemeral compute that clones your project, runs the build, and executes your tests.",
    },
    {
        index: "04",
        icon: GitPullRequest,
        title: "PRs with reasoning",
        description:
            "Work lands as a pull request with the diff and the agent's thinking side by side. Review it like a teammate wrote it.",
    },
    {
        index: "05",
        icon: ShieldCheck,
        title: "Your rules, your gates",
        description:
            "Nothing merges itself. Your review process, your branch protections, and your CI stay exactly where they are.",
    },
    {
        index: "06",
        icon: Bot,
        title: "Pick the right agent",
        description:
            "Assign Opus to the gnarly refactor and Sonnet to the long tail of chores — per issue, straight from the card.",
    },
];

export default function FeaturesSection() {
    return (
        <section id="features" className="scroll-mt-20 py-24">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-6 pb-16">
                <Reveal>
                    <Eyebrow text="Features" />
                </Reveal>
                <Reveal delay={0.08}>
                    <h2 className="text-4xl font-extralight leading-[1.05] text-neutral-900 sm:text-5xl md:text-6xl">
                        Everything between <br /> issue and merge.
                    </h2>
                </Reveal>
            </div>
            <div className="grid grid-cols-1 gap-px border-y border-neutral-200 bg-neutral-200 md:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((feature, i) => (
                    <div key={feature.index} className="bg-snow">
                        <Reveal
                            delay={(i % 3) * 0.07}
                            className="group flex h-full flex-col gap-5 p-6 transition-colors duration-200 hover:bg-mist sm:p-8"
                        >
                            <div className="flex items-center justify-between">
                                <feature.icon
                                    className="size-5 text-neutral-400 transition-colors duration-200 group-hover:text-[#AB9FF2]"
                                    aria-hidden
                                />
                                <span
                                    className={cn(
                                        "text-xs uppercase tracking-wide text-neutral-400",
                                        azeretMono.className,
                                    )}
                                >
                                    {feature.index}
                                </span>
                            </div>
                            <div className="text-xl text-neutral-900">{feature.title}</div>
                            <p className="text-sm leading-relaxed text-neutral-500">
                                {feature.description}
                            </p>
                        </Reveal>
                    </div>
                ))}
            </div>
        </section>
    );
}
