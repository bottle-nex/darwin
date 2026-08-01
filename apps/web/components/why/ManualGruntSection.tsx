import Reveal from "@/components/utility/Reveal";
import { ArchiveSectionHeader } from "./ArchiveSectionHeader";
import { FolderBox, type BoxFolder } from "./FolderBox";

const backlogFolders: BoxFolder[] = [
    { label: "Sprint 12", tint: "cement", decay: 0 },
    { label: "Backlog", tint: "cement", decay: 1 },
    { label: "Q3 goals", tint: "cement", decay: 2 },
    { label: "Someday", tint: "cement", decay: 3 },
    { label: "Icebox", tint: "cement", decay: 3 },
];

const manualSteps = [
    { step: "Read the ticket, find the owner", cost: "one standup" },
    { step: "Gather context across the repo", cost: "two hours" },
    { step: "Branch, fix, push", cost: "an afternoon" },
    { step: "Review ping-pong", cost: "three round trips" },
    { step: "Rebase, re-review, merge", cost: "one more day" },
];

export function ManualGruntSection() {
    return (
        <section className="relative border-t border-white/10">
            <div className="relative mx-auto w-full max-w-7xl px-6 py-24">
                <ArchiveSectionHeader
                    headline={
                        <>
                            Filed. Triaged. <span className="text-neutral-600">Forgotten.</span>
                        </>
                    }
                />
                <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_1.2fr]">
                    <div>
                        <Reveal>
                            <p className="max-w-md font-light leading-relaxed text-neutral-400">
                                Solving an issue in Linear or Trello was never the hard part. It is
                                everything around it: the triage call, the context hunt, the review
                                queue. That is what turns a two-hour fix into a two-week card.
                            </p>
                        </Reveal>
                        <div className="mt-8 max-w-md divide-y divide-white/10">
                            {manualSteps.map((item, i) => (
                                <Reveal key={item.step} delay={i * 0.05}>
                                    <div className="flex items-baseline justify-between gap-6 py-3">
                                        <span className="text-[15px] font-light text-neutral-300">
                                            {item.step}
                                        </span>
                                        <span className="shrink-0 text-sm font-light text-neutral-500">
                                            {item.cost}
                                        </span>
                                    </div>
                                </Reveal>
                            ))}
                            <Reveal delay={0.3}>
                                <div className="flex items-baseline justify-between gap-6 py-3">
                                    <span className="text-[15px] text-neutral-100">
                                        Door to merge
                                    </span>
                                    <span className="shrink-0 text-sm text-neutral-100">
                                        about two weeks
                                    </span>
                                </div>
                            </Reveal>
                        </div>
                    </div>
                    <Reveal className="relative">
                        <FolderBox folders={backlogFolders} showBase={false} />
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
