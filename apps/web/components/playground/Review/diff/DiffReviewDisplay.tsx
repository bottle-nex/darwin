"use client";
import type { ReactNode } from "react";
import { FiRefreshCw } from "react-icons/fi";

import LogoLoader from "@/components/app/LogoLoader";
import { Button } from "@/components/ui/button";
import { useProductDiff } from "@/hooks/project/useProductDiff";
import { useRegenerateProductDiff } from "@/hooks/project/useRegenerateProductDiff";
import { useActiveProject } from "@/hooks/useActiveProject";

export default function DiffReviewDisplay({
    productDiffId,
    issueId,
}: {
    productDiffId: string | null;
    issueId: string;
}) {
    const projectId = useActiveProject()?.id;
    const { data: detail } = useProductDiff(projectId, productDiffId);
    const regenerate = useRegenerateProductDiff();

    function handleRegenerate() {
        if (!projectId) return;
        regenerate.mutate({ projectId, issueId });
    }

    const retry = (
        <Button size="sm" loading={regenerate.isPending} onClick={handleRegenerate}>
            <FiRefreshCw />
            Retry
        </Button>
    );

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col px-6 py-5">
            {!productDiffId && (
                <DiffStatus
                    title="No preview yet"
                    body="A preview is built once the agent opens a frontend pull request for this issue."
                />
            )}
            {productDiffId && !detail && <LogoLoader className="h-full w-full text-snow" />}
            {detail && detail.status === "Pending" && (
                <DiffStatus
                    title="Queued"
                    body="A sandbox is about to build both revisions of every changed component."
                />
            )}
            {detail && detail.status === "Generating" && (
                <DiffStatus
                    title="Building"
                    body="Both revisions are compiling in a clean sandbox. This updates on its own."
                />
            )}
            {detail && detail.status === "Unsupported" && (
                <DiffStatus
                    title="Nothing to preview"
                    body={detail.error ?? "This pull request changes no previewable components."}
                />
            )}
            {detail && (detail.status === "Failed" || detail.status === "Stale") && (
                <DiffStatus
                    title={detail.status === "Stale" ? "Out of date" : "Build failed"}
                    body={detail.error ?? "The pull request changed after this preview was built."}
                    action={retry}
                />
            )}
            {detail && detail.status === "Ready" && (
                <DiffStatus
                    title="Preview viewer is being rebuilt"
                    body="The capsule pipeline replaces the old screenshot preview. Regenerate once it ships."
                    action={retry}
                />
            )}
        </div>
    );
}

function DiffStatus({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <h2 className="text-sm font-medium text-neutral-200">{title}</h2>
            <p className="max-w-md text-[13px] leading-relaxed text-neutral-500">{body}</p>
            {action}
        </div>
    );
}
