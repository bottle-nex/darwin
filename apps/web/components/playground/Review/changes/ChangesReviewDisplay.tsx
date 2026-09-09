"use client";
import { DiffView, type ReviewFile, type ReviewHeader } from "@trydarwin/types";
import { useState } from "react";

import LogoLoader from "@/components/app/LogoLoader";
import { useReviewFiles } from "@/hooks/review/useReviewFiles";
import { useUserConfig } from "@/hooks/user/useUserConfig";
import { shortSha } from "@/lib/review/commit";
import { cn } from "@/lib/utils";

import ReviewFileDiff from "./ReviewFileDiff";
import ReviewFileRow from "./ReviewFileRow";

function totals(files: ReviewFile[]) {
    return files.reduce(
        (sum, file) => ({
            additions: sum.additions + file.additions,
            deletions: sum.deletions + file.deletions,
        }),
        { additions: 0, deletions: 0 },
    );
}

export default function ChangesReviewDisplay({
    projectId,
    review,
    commit,
}: {
    projectId: string | undefined;
    review: ReviewHeader;
    commit: string | undefined;
}) {
    const { data: files, isPending } = useReviewFiles(projectId, review.pullNumber, commit);
    const { diffView } = useUserConfig();
    const [selectedFilename, setSelectedFilename] = useState<string | null>(null);

    if (isPending) return <LogoLoader className="h-full w-full text-overlay" />;
    if (!files?.length) {
        return (
            <p className="flex flex-1 items-center justify-center font-headline text-[13.5px] text-neutral-500">
                {commit ? "This commit changes no files." : "This pull request changes no files."}
            </p>
        );
    }

    const activeFile: ReviewFile =
        files.find((file) => file.filename === selectedFilename) ?? files[0];
    const { additions, deletions } = commit ? totals(files) : review;

    return (
        <div
            className={cn(
                "grid min-h-0 min-w-0 flex-1 gap-4 px-4 py-4",
                diffView === DiffView.Split
                    ? "grid-cols-[15rem_minmax(0,1fr)]"
                    : "grid-cols-[20rem_minmax(0,1fr)]",
            )}
        >
            <aside className="flex min-h-0 flex-col gap-2 overflow-y-auto px-1" data-lenis-prevent>
                <p className="px-3 font-headline text-[12.5px] text-neutral-500 tabular-nums">
                    {commit && <span className="font-mono">{shortSha(commit)} · </span>}
                    {files.length} {files.length === 1 ? "file" : "files"} changed{" "}
                    <span className="text-success">+{additions}</span>{" "}
                    <span className="text-danger">−{deletions}</span>
                </p>
                {files.map((file) => (
                    <ReviewFileRow
                        key={file.filename}
                        file={file}
                        selected={file.filename === activeFile.filename}
                        onSelect={() => setSelectedFilename(file.filename)}
                    />
                ))}
            </aside>

            <ReviewFileDiff
                key={activeFile.filename}
                file={activeFile}
                projectId={projectId}
                pullNumber={review.pullNumber}
                viewType={diffView}
                expandable={!commit}
            />
        </div>
    );
}
