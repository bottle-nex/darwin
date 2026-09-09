"use client";
import { DiffView, type ReviewFile } from "@trydarwin/types";
import { DiffExpandIcon, DiffFileRowIcon, ExternalLinkIcon } from "@trydarwin/ui/icons";
import { type ReactNode, useMemo, useState } from "react";
import {
    computeNewLineNumber,
    computeOldLineNumber,
    Decoration,
    Diff,
    expandFromRawCode,
    getCollapsedLinesCountBetween,
    type GutterOptions,
    Hunk,
    type HunkData,
    parseDiff,
    tokenize,
} from "react-diff-view";

import { Button } from "@/components/ui/button";
import { useReviewFileSource } from "@/hooks/review/useReviewFileSource";
import { useUserConfig } from "@/hooks/user/useUserConfig";
import { codeThemeVars } from "@/lib/codeThemes";
import { cn } from "@/lib/utils";
import { usePlaygroundTheme } from "@/store/playground/usePlaygroundThemeStore";

import { languageFor, refractor } from "./diffLanguage";
import { splitPath } from "./ReviewFileRow";

const MAX_EXPANDABLE_LINES = 2000;

export default function ReviewFileDiff({
    file,
    projectId,
    pullNumber,
    viewType,
    expandable: allowExpand,
}: {
    file: ReviewFile;
    projectId: string | undefined;
    pullNumber: number;
    viewType: DiffView;
    /**
     * False while a commit filter is on. Expansion reads the file at the pull request's base, which
     * is the wrong side for one commit's hunks, so the option is withheld rather than shown wrong.
     */
    expandable: boolean;
}) {
    const { name, directory } = splitPath(file.filename);
    const { codeTheme } = useUserConfig();
    const surface = usePlaygroundTheme();
    const [wholeFile, setWholeFile] = useState(false);
    const [ranges, setRanges] = useState<Array<[number, number]>>([]);
    const wantsSource = wholeFile || ranges.length > 0;

    const parsed = useMemo(
        () =>
            file.patch ? (parseDiff(toGitDiff(file), { nearbySequences: "zip" })[0] ?? null) : null,
        [file],
    );
    const hunks: HunkData[] = useMemo(() => parsed?.hunks ?? [], [parsed]);

    const expandable = allowExpand && file.status !== "added" && Boolean(file.patch);
    const { data: fileSource, isPending: sourcePending } = useReviewFileSource(
        projectId,
        pullNumber,
        file.filename,
        wantsSource && expandable,
    );
    const tooLarge = (fileSource?.lines ?? 0) > MAX_EXPANDABLE_LINES;
    const sourceLines = useMemo(() => {
        if (!fileSource?.source || tooLarge) return null;
        return fileSource.source.split("\n");
    }, [fileSource, tooLarge]);

    const renderedHunks = useMemo(() => {
        if (!sourceLines) return hunks;
        if (wholeFile) return expandFromRawCode(hunks, sourceLines, 1, sourceLines.length);
        return ranges.reduce(
            (current, [from, to]) => expandFromRawCode(current, sourceLines, from, to),
            hunks,
        );
    }, [hunks, sourceLines, wholeFile, ranges]);

    const tokens = useMemo(() => {
        const language = languageFor(file.filename);
        if (!renderedHunks.length || !language) return null;
        try {
            return tokenize(renderedHunks, { highlight: true, refractor, language });
        } catch {
            return null;
        }
        // Deliberately not keyed on the theme: tokenize only produces class names, and
        // colour is applied in CSS. Adding it here would re-run Prism over the whole
        // file on every theme change.
    }, [renderedHunks, file.filename]);

    return (
        // The theme variables go here rather than on <Diff> because react-diff-view
        // only reads a fixed list of props and drops a style prop entirely.
        <section
            style={codeThemeVars(codeTheme, surface)}
            className="surface-card flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg"
        >
            <header className="flex shrink-0 items-center gap-2 px-3 py-2.5">
                <DiffFileRowIcon className="size-3.5 shrink-0 text-neutral-500" />
                <span className="shrink-0 font-headline text-[14px] font-medium text-neutral-100">
                    {name}
                </span>
                <span className="min-w-0 flex-1 truncate font-headline text-[14px] text-overlay/60 pb-[1.5px]">
                    {file.previousFilename ? `renamed from ${file.previousFilename}` : directory}
                </span>

                {expandable && (
                    <Button
                        variant="unstyled"
                        onClick={() => {
                            setRanges([]);
                            setWholeFile(!wholeFile);
                        }}
                        loading={wantsSource && sourcePending}
                        className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1 font-headline text-[12px] text-neutral-500 transition-colors hover:bg-overlay/5 hover:text-neutral-200"
                    >
                        {tooLarge
                            ? "Too large to expand"
                            : wholeFile
                              ? "Changes only"
                              : "Whole file"}
                    </Button>
                )}

                <span className="shrink-0 font-headline text-[12.5px] tabular-nums">
                    {file.additions > 0 && <span className="text-success">+{file.additions}</span>}
                    {file.deletions > 0 && <span className="text-danger"> −{file.deletions}</span>}
                </span>
                {file.htmlUrl && (
                    <a
                        href={file.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-neutral-600 transition-colors hover:text-neutral-300"
                        aria-label={`Open ${name} on GitHub`}
                    >
                        <ExternalLinkIcon className="size-3.5" />
                    </a>
                )}
            </header>

            {renderedHunks.length === 0 ? (
                <p className="px-3 py-4 font-headline text-[13px] text-neutral-500">
                    {file.patch === null
                        ? "This file is too large or too binary to show here — open it on GitHub."
                        : "No textual changes in this file."}
                </p>
            ) : (
                <div className="min-h-0 flex-1 overflow-auto" data-lenis-prevent>
                    <Diff
                        viewType={viewType === DiffView.Split ? "split" : "unified"}
                        diffType={parsed!.type}
                        hunks={renderedHunks}
                        tokens={tokens}
                        renderGutter={GUTTER[viewType]}
                        className="review-diff"
                    >
                        {(rendered) =>
                            rendered.flatMap((hunk, index) => {
                                const previous = index === 0 ? null : rendered[index - 1];
                                const skipped = getCollapsedLinesCountBetween(previous, hunk);
                                return [
                                    <HunkGap
                                        key={`gap-${hunk.content}`}
                                        skipped={skipped}
                                        onExpand={
                                            expandable && !tooLarge && !wholeFile
                                                ? () =>
                                                      setRanges((current) => [
                                                          ...current,
                                                          [
                                                              hunk.oldStart - skipped,
                                                              hunk.oldStart - 1,
                                                          ],
                                                      ])
                                                : undefined
                                        }
                                    />,
                                    <Hunk key={`hunk-${hunk.content}`} hunk={hunk} />,
                                ];
                            })
                        }
                    </Diff>
                </div>
            )}
        </section>
    );
}

/**
 * Unified has a single gutter, so it shows the new line number and falls back to the old one for a
 * deletion. Split has one gutter per side, and each side counts in its own file.
 */
const GUTTER: Record<DiffView, (options: GutterOptions) => ReactNode> = {
    [DiffView.Unified]: ({ change, side }) => {
        if (side === "old") return null;
        const lineNumber = computeNewLineNumber(change);
        return lineNumber === -1 ? computeOldLineNumber(change) : lineNumber;
    },
    [DiffView.Split]: ({ change, side }) => {
        const lineNumber =
            side === "old" ? computeOldLineNumber(change) : computeNewLineNumber(change);
        return lineNumber === -1 ? null : lineNumber;
    },
};

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

function HunkGap({ skipped, onExpand }: { skipped: number; onExpand?: () => void }) {
    if (skipped <= 0) return null;
    const label = `${skipped} unchanged ${skipped === 1 ? "line" : "lines"}`;

    return (
        <Decoration>
            <Button
                variant="unstyled"
                disabled={!onExpand}
                onClick={onExpand}
                className={cn(
                    "flex w-full items-center justify-center gap-1.5 py-1 font-headline text-[12.5px] text-neutral-500 transition-colors",
                    onExpand && "cursor-pointer hover:bg-overlay/4 hover:text-neutral-300",
                )}
            >
                <DiffExpandIcon className="size-3" />
                {label}
            </Button>
        </Decoration>
    );
}
