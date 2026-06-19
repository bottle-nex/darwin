import { Button } from "@/components/ui/button";
import {
    RiBookOpenFill,
    RiFilePaperFill,
    RiGitPullRequestFill,
    RiGithubFill,
    RiLayoutColumnFill,
    RiRobot2Fill,
    RiSearchEyeFill,
    RiServerFill,
    RiShieldCheckFill,
} from "react-icons/ri";
import Reveal from "@/components/utility/Reveal";
import FeatureCard from "./features/FeatureCard";
import BoardPreview from "./features/previews/BoardPreview";
import RepoPreview from "./features/previews/RepoPreview";
import StackPreview from "./features/previews/StackPreview";
import AppLogo from "@/components/app/Applogo";

export default function FeaturesSection() {
    return (
        <main
            className="relative mx-6 squircle rounded-[118px]"
            style={{ background: "linear-gradient(180deg,#0f0f10,#1f1f21),#111113" }}
        >
            <section id="features" className="mx-auto max-w-332 scroll-mt-20 py-24">
                <div className="mx-auto flex w-full max-w-332 flex-col gap-7 px-6">
                    <Reveal>
                        <div className="flex w-full justify-center">
                            <AppLogo className="text-white" />
                        </div>
                    </Reveal>
                    <Reveal delay={0.08}>
                        <h2 className="text-4xl font-extralight leading-[1.05] text-neutral-100 sm:text-5xl md:text-6xl text-center">
                            Everything between <br />{" "}
                            <span className="text-neutral-400">issue and merge.</span>
                        </h2>
                    </Reveal>
                </div>
                <div className="w-full flex justify-center items-center gap-3 my-12">
                    <Button variant="tertiary" className="flex items-center gap-2">
                        View on GitHub
                        <RiGithubFill className="size-4 text-neutral-900!" />
                    </Button>
                    <Button className="flex items-center gap-2">
                        Read Docs
                        <RiFilePaperFill className="size-4" />
                    </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-2 lg:grid-cols-3">
                    <FeatureCard
                        index="01"
                        icon={RiLayoutColumnFill}
                        tone="dark"
                        title="The board you already know"
                        description="A Kanban canvas your whole team plans on — except the assignees are agents and the columns drain themselves."
                        preview={<BoardPreview />}
                        delay={0}
                    />
                    <FeatureCard
                        index="02"
                        icon={RiSearchEyeFill}
                        title="Reads the repo first"
                        description="Before touching a line, the agent builds context: your conventions, your structure, the blast radius of the change."
                        preview={<RepoPreview />}
                        delay={0.07}
                    />
                    <FeatureCard
                        index="03"
                        icon={RiServerFill}
                        tone="primary"
                        title="Sandboxed code runners"
                        description="Every change is made on ephemeral compute that clones your project, runs the build, and executes your tests."
                        preview={<StackPreview />}
                        delay={0.14}
                    />
                    <FeatureCard
                        index="04"
                        icon={RiGitPullRequestFill}
                        tone="ink"
                        title="PRs with reasoning"
                        description="Work lands as a pull request with the diff and the agent's thinking side by side. Review it like a teammate wrote it."
                        delay={0}
                    />
                    <FeatureCard
                        index="05"
                        icon={RiShieldCheckFill}
                        tone="ink"
                        title="Your rules, your gates"
                        description="Nothing merges itself. Your review process, your branch protections, and your CI stay exactly where they are."
                        delay={0.07}
                    />
                    <FeatureCard
                        index="06"
                        icon={RiRobot2Fill}
                        tone="ink"
                        title="Pick the right agent"
                        description="Assign Opus to the gnarly refactor and Sonnet to the long tail of chores — per issue, straight from the card."
                        delay={0.14}
                    />
                </div>
                <Reveal>
                    <div className="mt-16 flex flex-col gap-8 px-6 pt-12 sm:flex-row sm:items-center sm:justify-between sm:gap-12">
                        <div className="max-w-5xl">
                            <h3 className="text-2xl font-extralight leading-snug text-neutral-100 sm:text-3xl">
                                Hold your matcha.{" "}
                                <span className="text-neutral-400">
                                    We&apos;ll bank the busywork.
                                </span>
                            </h3>
                            <p className="mt-4 leading-relaxed text-neutral-400">
                                Pour a cup and step away from the backlog. Our agents claim your
                                issues, ship the fix on real runners, and hand it back as a reviewed
                                pull request — so your team keeps its hours for the work that grows
                                the business.
                            </p>
                        </div>
                        <Button variant="tertiary" className="shrink-0">
                            Read more
                            <RiBookOpenFill className="size-4 text-neutral-800!" />
                        </Button>
                    </div>
                </Reveal>
            </section>
            {/* Bottom fade blends the cards into the main's charcoal edge. */}
            {/* <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-48 rounded-b-2xl bg-linear-to-t from-neutral-900/80 via-neutral-800 to-transparent" /> */}
        </main>
    );
}
