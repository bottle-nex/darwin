import Reveal from "@/components/utility/Reveal";
import { ArchiveSectionHeader } from "./ArchiveSectionHeader";
import { LifecycleCard, type LifecycleStage } from "./LifecycleCard";

const lifecycleStages: LifecycleStage[] = [
    {
        index: "01",
        tab: "FILED",
        title: "Issue enters the drawer",
        description:
            "A card lands on the board like any other ticket: title, context, acceptance notes.",
        surface: "cement",
    },
    {
        index: "02",
        tab: "CLAIMED",
        title: "Agent pulls the folder",
        description:
            "An agent picks the card off the kanban and moves it to in-progress. No standup required.",
        surface: "snow",
    },
    {
        index: "03",
        tab: "EXECUTED",
        title: "Worked in a sandboxed runner",
        description:
            "The runner clones your repo, implements the fix, and verifies it against your real project.",
        surface: "primary",
    },
    {
        index: "04",
        tab: "RETURNED",
        title: "Out comes the PR",
        description:
            "The folder is refiled as a pull request with a diff and the agent's reasoning. You review, you merge.",
        accent: true,
        surface: "snow",
    },
];

export function AgentsSection() {
    return (
        <section id="agents" className="border-t border-white/10">
            <div className="mx-auto w-full max-w-7xl px-6 py-24">
                <ArchiveSectionHeader
                    headline={
                        <>
                            The folder comes back as a{" "}
                            <span className="text-primary">pull request.</span>
                        </>
                    }
                />
                <Reveal>
                    <p className="mt-8 max-w-2xl font-light leading-relaxed text-neutral-400">
                        Park the issue on the kanban like you always have. An agent claims the card,
                        does the work, and moves it across the board while your team stays on the
                        problems that need a human.
                    </p>
                </Reveal>
                <div className="relative mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div
                        aria-hidden
                        className="absolute left-0 right-0 top-24 hidden border-t border-dashed border-white/10 xl:block"
                    />
                    {lifecycleStages.map((stage, i) => (
                        <Reveal key={stage.tab} delay={i * 0.08} className="relative">
                            <LifecycleCard stage={stage} />
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
