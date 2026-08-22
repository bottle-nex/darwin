"use client";
import { useState } from "react";
import type { ReviewFile, ReviewHeader } from "@trymatcha/types";
import LogoLoader from "@/components/app/LogoLoader";
import { useReviewFiles } from "@/hooks/review/useReviewFiles";
import ReviewFileDiff from "./ReviewFileDiff";
import ReviewFileRow from "./ReviewFileRow";

export default function ReviewChanges({
    projectId,
    review,
}: {
    projectId: string | undefined;
    review: ReviewHeader;
}) {
    const { data: files, isPending } = useReviewFiles(projectId, review.pullNumber);
    const [selected, setSelected] = useState<string | null>(null);

    if (isPending) return <LogoLoader className="h-full w-full text-snow" />;
    if (!files?.length) {
        return (
            <p className="flex flex-1 items-center justify-center font-headline text-[13.5px] text-neutral-500">
                This pull request changes no files.
            </p>
        );
    }

    const active: ReviewFile = files.find((file) => file.filename === selected) ?? files[0];

    return (
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[20rem_minmax(0,1fr)] gap-4 px-10 py-4">
            <aside className="flex min-h-0 flex-col gap-2 overflow-y-auto pr-1" data-lenis-prevent>
                <p className="px-2 font-headline text-[12.5px] text-neutral-500 tabular-nums">
                    {files.length} {files.length === 1 ? "file" : "files"} changed{" "}
                    <span className="text-green-500">+{review.additions}</span>{" "}
                    <span className="text-rose-500">−{review.deletions}</span>
                </p>
                {files.map((file) => (
                    <ReviewFileRow
                        key={file.filename}
                        file={file}
                        selected={file.filename === active.filename}
                        onSelect={() => setSelected(file.filename)}
                    />
                ))}
            </aside>

            <ReviewFileDiff
                key={active.filename}
                file={active}
                projectId={projectId}
                pullNumber={review.pullNumber}
            />
        </div>
    );
}
