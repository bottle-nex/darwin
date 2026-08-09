import { Button } from "@/components/ui/button";
import {
    RiFilePaperFill,
    RiGithubFill,
    RiLayoutColumnFill,
    RiSearchEyeFill,
    RiServerFill,
} from "react-icons/ri";
import FeatureCard from "../landing/v2/features/FeatureCard";
import BoardPreview from "../landing/v2/features/previews/BoardPreview";
import RepoPreview from "../landing/v2/features/previews/RepoPreview";
import StackPreview from "../landing/v2/features/previews/StackPreview";
import { cn } from "@/lib/utils";

export default function LandingFeatures() {
    return (
        <main className="relative mx-6 rounded-4xl bg-linear-to-b from-transparent to-primary/60 mt-8">
            <section id="features" className="mx-auto w-full max-w-7xl flex flex-col items-center py-24">
                <button
                    className="mt-8 bg-[#edeaff] text-[#675cb7] px-3 py-1.5 font-medium rounded-[7px] cursor-pointer tracking-tight text-[13px] flex items-center gap-1.5"
                >
                    How it works
                </button>
                <div
                    className={cn(
                        // sourceSerif4.className,
                        "pt-6 text-[2.4rem] text-[#434152] tracking-tight font-medium w-full text-center flex justify-center leading-none",
                    )}
                >
                    Autonomous engineering, from issue to review.
                </div>
                <div className="pt-6 text-[1rem] text-foreground/55 w-110 text-center flex justify-center leading-[1.2]">
                    Every change is built and verified against your actual repo before the PR opens.
                </div>

                <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-2 lg:grid-cols-3 pt-12">
                    <FeatureCard
                        index="01"
                        icon={RiLayoutColumnFill}
                        tone="dark"
                        title="The board you already know"
                        description="A Kanban canvas your whole team plans on, except the assignees are agents and the columns drain themselves."
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
                </div>
            </section>
        </main>
    );
}
