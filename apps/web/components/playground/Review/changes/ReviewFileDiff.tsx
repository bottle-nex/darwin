"use client";
import { useMemo } from "react";
import {
    Decoration,
    Diff,
    getCollapsedLinesCountBetween,
    Hunk,
    parseDiff,
    tokenize,
    type HunkData,
} from "react-diff-view";
import { GoFileCode } from "react-icons/go";
import { LuChevronsUpDown, LuExternalLink } from "react-icons/lu";
import type { ReviewFile } from "@trymatcha/types";
import { languageFor, refractor } from "./diffLanguage";
import { splitPath } from "./ReviewFileRow";

export default function ReviewFileDiff({ file }: { file: ReviewFile }) {
    const { name, directory } = splitPath(file.filename);

    const parsed = useMemo(
        () =>
            file.patch ? (parseDiff(toGitDiff(file), { nearbySequences: "zip" })[0] ?? null) : null,
        [file],
    );

    const hunks: HunkData[] = useMemo(() => parsed?.hunks ?? [], [parsed]);

    const tokens = useMemo(() => {
        const language = languageFor(file.filename);
        if (!hunks.length || !language) return null;
        try {
            return tokenize(hunks, { highlight: true, refractor, language });
        } catch {
            return null;
        }
    }, [hunks, file.filename]);

    return (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
            <header className="flex shrink-0 items-center gap-2 border-b border-border bg-white/[0.02] px-3 py-2">
                <GoFileCode className="size-3.5 shrink-0 text-neutral-500" />
                <span className="shrink-0 text-[14px] font-medium text-neutral-100">{name}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-neutral-600">
                    {file.previousFilename ? `renamed from ${file.previousFilename}` : directory}
                </span>
                <span className="shrink-0 text-[12.5px] tabular-nums">
                    {file.additions > 0 && (
                        <span className="text-green-400">+{file.additions}</span>
                    )}
                    {file.deletions > 0 && (
                        <span className="text-rose-400"> −{file.deletions}</span>
                    )}
                </span>
                {file.htmlUrl && (
                    <a
                        href={file.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-neutral-600 transition-colors hover:text-neutral-300"
                        aria-label={`Open ${name} on GitHub`}
                    >
                        <LuExternalLink className="size-3.5" />
                    </a>
                )}
            </header>

            {hunks.length === 0 ? (
                <p className="px-3 py-4 text-[13px] text-neutral-500">
                    {file.patch === null
                        ? "This file is too large or too binary to show here — open it on GitHub."
                        : "No textual changes in this file."}
                </p>
            ) : (
                <div className="min-h-0 flex-1 overflow-auto" data-lenis-prevent>
                    <Diff
                        viewType="unified"
                        diffType={parsed!.type}
                        hunks={hunks}
                        tokens={tokens}
                        className="review-diff"
                    >
                        {(rendered) =>
                            rendered.flatMap((hunk, index) => [
                                <HunkGap
                                    key={`gap-${hunk.content}`}
                                    skipped={
                                        index === 0
                                            ? hunk.oldStart - 1
                                            : getCollapsedLinesCountBetween(
                                                  rendered[index - 1],
                                                  hunk,
                                              )
                                    }
                                />,
                                <Hunk key={`hunk-${hunk.content}`} hunk={hunk} />,
                            ])
                        }
                    </Diff>
                </div>
            )}
        </section>
    );
}

function toGitDiff(file: ReviewFile): string {
    const before = file.previousFilename ?? file.filename;
    const from = file.status === "added" ? "/dev/null" : `a/${before}`;
    const to = file.status === "removed" ? "/dev/null" : `b/${file.filename}`;
    return [
        `diff --git a/${before} b/${file.filename}`,
        `--- ${from}`,
        `+++ ${to}`,
        file.patch,
    ].join("\n");
}

function HunkGap({ skipped }: { skipped: number }) {
    if (skipped <= 0) return null;
    return (
        <Decoration>
            <span className="flex items-center justify-center gap-1.5 py-1 text-[12.5px] text-neutral-500">
                <LuChevronsUpDown className="size-3" />
                {skipped} unchanged {skipped === 1 ? "line" : "lines"}
            </span>
        </Decoration>
    );
}
