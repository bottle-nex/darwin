import { cn } from "@/lib/utils";
import { azeretMono } from "@/components/ui/button";
import Reveal from "@/components/utility/Reveal";
import { ArchiveSectionHeader } from "./ArchiveSectionHeader";
import { FolderBox, type BoxFolder } from "./FolderBox";

const backlogFolders: BoxFolder[] = [
    { label: "SPRINT 12", tint: "cement", decay: 0 },
    { label: "BACKLOG", tint: "cement", decay: 1 },
    { label: "Q3 GOALS", tint: "cement", decay: 2 },
    { label: "SOMEDAY", tint: "cement", decay: 3 },
    { label: "ICEBOX", tint: "cement", decay: 3 },
];

const manualSteps = [
    { step: "READ THE TICKET, FIND THE OWNER", cost: "1 STANDUP" },
    { step: "GATHER CONTEXT ACROSS THE REPO", cost: "2 HRS" },
    { step: "BRANCH, FIX, PUSH", cost: "1 AFTERNOON" },
    { step: "REVIEW PING-PONG", cost: "3 ROUND TRIPS" },
    { step: "REBASE, RE-REVIEW, MERGE", cost: "1 MORE DAY" },
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
                        <div className="mt-8">
                            {manualSteps.map((item, i) => (
                                <Reveal key={item.step} delay={i * 0.05}>
                                    <div className="flex items-baseline justify-between gap-4 border-b border-dotted border-white/15 py-3">
                                        <span
                                            className={cn(
                                                "text-[11px] uppercase tracking-widest text-neutral-300",
                                                azeretMono.className,
                                            )}
                                        >
                                            {item.step}
                                        </span>
                                        <span
                                            className={cn(
                                                "shrink-0 text-[11px] uppercase tracking-widest text-neutral-600",
                                                azeretMono.className,
                                            )}
                                        >
                                            {item.cost}
                                        </span>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                    <Reveal className="relative">
                        <div
                            className={cn(
                                "flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-600",
                                azeretMono.className,
                            )}
                        >
                            <span>DRAWER 03 / OPEN ITEMS</span>
                            <span>CAPACITY EXCEEDED</span>
                        </div>
                        <FolderBox folders={backlogFolders} className="mt-4" />
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
