"use client";
import { DropdownCaretIcon } from "@trydarwin/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import LandingSection from "./LandingSection";
import SectionHeader from "./SectionHeader";

type FaqEntry = { question: string; answer: string };

const FAQS: FaqEntry[] = [
    {
        question: "How does an issue reach the agent?",
        answer: "You file it on the board like any other ticket. Once it moves to Queued an agent claims it, and you watch it move to In Progress on the same board you filed it from.",
    },
    {
        question: "Where does my code actually run?",
        answer: "In a sandboxed runner that clones your repository for that one issue. It installs dependencies and runs your real build and test commands there, then the runner is destroyed. Nothing executes on your machines.",
    },
    {
        question: "Does it open the pull request on its own?",
        answer: "Yes. The agent commits to a branch and opens a pull request against your repository. It never merges — a person reviews the diff and decides.",
    },
    {
        question: "What happens when the fix is wrong?",
        answer: "You see the whole run: every file the agent touched, every command it ran, and the diff it produced. Close the pull request and the issue goes back on the board.",
    },
    {
        question: "Which repositories can it work on?",
        answer: "Any GitHub repository you connect to a project. Projects scope which repositories an agent may touch, so a runner never sees code outside the one it was given.",
    },
    {
        question: "Who on my team can file issues?",
        answer: "Anyone with access to that project. Organisations, teams and projects carry GitHub-style roles, so the same permissions that decide who owns a repository decide who can file against it.",
    },
];

const PANEL_TRANSITION = { duration: 0.28, ease: [0.22, 1, 0.36, 1] } as const;

export default function LandingFaq() {
    const reduceMotion = useReducedMotion();
    const [openQuestion, setOpenQuestion] = useState<string | null>(null);

    return (
        <LandingSection>
            <div
                id="faq"
                className="grid gap-y-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] md:gap-x-16"
            >
                <div>
                    <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                        FAQ
                    </p>
                    <SectionHeader
                        className="mt-4"
                        title="Questions before shipping."
                        titleContinued="Answered plainly."
                        description="How an issue reaches an agent, where your code runs, and who decides what merges."
                    />
                </div>

                <div className="border-t border-edge">
                    {FAQS.map((faq) => {
                        const open = openQuestion === faq.question;
                        return (
                            <div key={faq.question} className="border-b border-edge">
                                <button
                                    type="button"
                                    aria-expanded={open}
                                    onClick={() => setOpenQuestion(open ? null : faq.question)}
                                    className="group flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left"
                                >
                                    <span className="text-[16px] font-normal text-foreground">
                                        {faq.question}
                                    </span>
                                    <DropdownCaretIcon
                                        aria-hidden
                                        className={cn(
                                            "size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:text-foreground",
                                            open && "rotate-180",
                                        )}
                                    />
                                </button>

                                <AnimatePresence initial={false}>
                                    {open && (
                                        <motion.div
                                            key="answer"
                                            initial={
                                                reduceMotion ? false : { height: 0, opacity: 0 }
                                            }
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={PANEL_TRANSITION}
                                            className="overflow-hidden"
                                        >
                                            <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-muted-foreground">
                                                {faq.answer}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </LandingSection>
    );
}
