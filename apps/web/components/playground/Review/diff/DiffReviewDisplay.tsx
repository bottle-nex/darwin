"use client";
import type { Capsule } from "@trymatcha/types";
import { DiffPreviewIcon, RetryActionIcon, WarningTriangleIcon } from "@trymatcha/ui/icons";
import { useMemo, useState } from "react";

import LogoLoader from "@/components/app/LogoLoader";
import { MICRO_LABEL } from "@/components/playground/Core/components/paneBar";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";
import { Button } from "@/components/ui/button";
import { useProductDiff } from "@/hooks/project/useProductDiff";
import { useProductDiffArtifacts } from "@/hooks/project/useProductDiffArtifacts";
import { useRegenerateProductDiff } from "@/hooks/project/useRegenerateProductDiff";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";

import CapsuleComparison from "./CapsuleComparison";
import CapsuleList from "./CapsuleList";

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

    const [selectedId, setSelectedId] = useState("");
    const [controlValues, setControlValues] = useState<Record<string, string>>({});

    const capsules = useMemo(() => detail?.manifest?.capsules ?? [], [detail?.manifest]);
    const capsule = capsules.find((item) => item.id === selectedId) ?? capsules[0];
    const artifactKeys = useMemo(() => revision_paths(capsule), [capsule]);
    const { data: urls } = useProductDiffArtifacts(projectId, productDiffId, artifactKeys);

    function handleSelect(id: string) {
        setSelectedId(id);
        setControlValues({});
    }

    function handleRegenerate() {
        if (!projectId) return;
        regenerate.mutate({ projectId, issueId });
    }

    const retry = (
        <Button size="sm" loading={regenerate.isPending} onClick={handleRegenerate}>
            <RetryActionIcon />
            Retry
        </Button>
    );

    if (!productDiffId) {
        return (
            <PaneEmptyState
                icon={DiffPreviewIcon}
                title="No preview yet"
                subtitle="A preview is built once the agent opens a frontend pull request for this issue."
            />
        );
    }

    if (!detail) return <LogoLoader className="h-full w-full text-snow" />;

    if (detail.status === "Pending" || detail.status === "Generating") {
        return (
            <PaneEmptyState
                icon={DiffPreviewIcon}
                title={detail.status === "Pending" ? "Queued" : "Building"}
                subtitle="Both revisions of every changed component are compiling in a clean sandbox. This updates on its own."
            />
        );
    }

    if (detail.status === "Unsupported") {
        return (
            <PaneEmptyState
                icon={DiffPreviewIcon}
                title="Nothing to preview"
                subtitle={detail.error ?? "This pull request changes no previewable components."}
            />
        );
    }

    if (detail.status === "Failed" || detail.status === "Stale") {
        return (
            <PaneEmptyState
                icon={WarningTriangleIcon}
                title={detail.status === "Stale" ? "Out of date" : "Preview failed"}
                subtitle={detail.error ?? "The pull request changed after this preview was built."}
            >
                {retry}
            </PaneEmptyState>
        );
    }

    if (!capsule) {
        return (
            <PaneEmptyState
                icon={DiffPreviewIcon}
                title="Nothing rendered"
                subtitle="No component in this pull request could be rendered on its own."
            >
                {retry}
            </PaneEmptyState>
        );
    }

    const warnings = detail.manifest?.warnings ?? [];

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col px-4 py-4">
            <div
                className={cn(
                    "grid min-h-0 min-w-0 flex-1 gap-4",
                    capsules.length > 1
                        ? "grid-cols-[20rem_minmax(0,1fr)]"
                        : "grid-cols-[minmax(0,1fr)]",
                )}
            >
                {capsules.length > 1 && (
                    <aside
                        data-lenis-prevent
                        className="flex min-h-0 flex-col gap-2 overflow-y-auto px-1"
                    >
                        <CapsuleList
                            capsules={capsules}
                            selectedId={capsule.id}
                            onSelect={handleSelect}
                        />
                    </aside>
                )}
                <CapsuleComparison
                    capsule={capsule}
                    urls={urls ?? {}}
                    controlValues={controlValues}
                    onControlChange={(name, value) =>
                        setControlValues((current) => ({ ...current, [name]: value }))
                    }
                />
            </div>

            {warnings.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1 px-1">
                    {warnings.map((warning) => (
                        <li key={warning} className={MICRO_LABEL}>
                            {warning}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function revision_paths(capsule: Capsule | undefined): string[] {
    if (!capsule) return [];
    return [capsule.base?.path, capsule.head?.path].filter(
        (path): path is string => path !== undefined,
    );
}
