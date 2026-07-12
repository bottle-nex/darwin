"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { LuChevronDown, LuPencil } from "react-icons/lu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import { EASE, SECTION_VARIANTS, SectionLabel, approxTokensOf } from "./overviewTheme";

const COLLAPSED_HEIGHT = 224;

const FADE_MASK = "linear-gradient(to bottom, #000 55%, transparent 100%)";

const PLAIN_BUTTON = "font-sans normal-case";

type AgentBriefProps = {
    markdown: string;
    updatedAt: string;
    onSave: (markdown: string) => void;
};

export default function AgentBrief({ markdown, updatedAt, onSave }: AgentBriefProps) {
    const [expanded, setExpanded] = useState(false);
    const [draft, setDraft] = useState<string | null>(null);

    const editing = draft !== null;

    function startEditing() {
        setDraft(markdown);
        setExpanded(true);
    }

    function save() {
        if (draft !== null) onSave(draft);
        setDraft(null);
    }

    return (
        <motion.section variants={SECTION_VARIANTS}>
            <SectionLabel>Brief</SectionLabel>

            <div className="relative mt-3 overflow-hidden rounded-lg bg-white/3 shadow-[inset_0_1px_0_0_#262626]">
                <div className="flex h-10 items-center justify-between gap-2 border-b border-white/5 pr-2 pl-4">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-mono text-[12px] text-neutral-200">
                            AGENTS.md
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-[4px] bg-violet-400/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-300">
                            <HeroBuddy move={false} className="size-3.5 shrink-0" />
                            Read by agent
                        </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <span className="text-[11px] text-neutral-600">
                            ~{approxTokensOf(editing ? (draft ?? "") : markdown)} tokens
                        </span>

                        {!editing && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={startEditing}
                                className={cn(PLAIN_BUTTON, "text-neutral-400 hover:bg-white/5")}
                            >
                                <LuPencil aria-hidden />
                                Edit
                            </Button>
                        )}
                    </div>
                </div>

                {editing ? (
                    <>
                        <Textarea
                            value={draft ?? ""}
                            onChange={(event) => setDraft(event.target.value)}
                            spellCheck={false}
                            autoFocus
                            className="min-h-80 rounded-none border-0 bg-transparent px-4 py-3.5 font-mono text-[12px]! leading-[1.75] text-neutral-300 shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
                        />

                        <div className="flex items-center justify-end gap-2 border-t border-white/5 px-3 py-2">
                            <Button
                                type="button"
                                variant="tertiary"
                                size="sm"
                                onClick={() => setDraft(null)}
                                className={PLAIN_BUTTON}
                            >
                                Cancel
                            </Button>
                            <Button type="button" size="sm" onClick={save} className={PLAIN_BUTTON}>
                                Save brief
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <motion.div
                            initial={false}
                            animate={{ height: expanded ? "auto" : COLLAPSED_HEIGHT }}
                            transition={{ duration: 0.24, ease: EASE }}
                            className="overflow-hidden"
                            style={
                                expanded
                                    ? undefined
                                    : { maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }
                            }
                        >
                            <pre className="px-4 py-3.5 font-mono text-[12px] leading-[1.75] whitespace-pre-wrap text-neutral-400">
                                {markdown}
                            </pre>
                        </motion.div>

                        <div className="flex items-center justify-between gap-2 border-t border-white/5 py-1.5 pr-2 pl-4">
                            <span className="truncate text-[11px] text-neutral-600">
                                Updated {format(new Date(updatedAt), "MMM d, yyyy")}
                            </span>

                            <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={() => setExpanded((prev) => !prev)}
                                className={cn(PLAIN_BUTTON, "text-neutral-500 hover:bg-white/5")}
                            >
                                {expanded ? "Collapse" : "Expand"}
                                <LuChevronDown
                                    aria-hidden
                                    className={cn(
                                        "transition-transform duration-200",
                                        expanded && "rotate-180",
                                    )}
                                />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </motion.section>
    );
}
