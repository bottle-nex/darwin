"use client";
import { type Capsule, capsule_control_hash } from "@trymatcha/types";
import { type ReactNode, useMemo, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";

import LogoLoader from "@/components/app/LogoLoader";
import { Button } from "@/components/ui/button";
import { useProductDiff } from "@/hooks/project/useProductDiff";
import { useProductDiffArtifacts } from "@/hooks/project/useProductDiffArtifacts";
import { useRegenerateProductDiff } from "@/hooks/project/useRegenerateProductDiff";
import { useActiveProject } from "@/hooks/useActiveProject";
import type { CapsuleCompareMode, CapsuleViewport } from "@/types/capsule.type";

import CapsuleComparison from "./CapsuleComparison";
import CapsuleControls from "./CapsuleControls";
import CapsuleHeader from "./CapsuleHeader";
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
    const [viewport, setViewport] = useState<CapsuleViewport>("desktop");
    const [mode, setMode] = useState<CapsuleCompareMode>("split");

    const capsules = useMemo(() => detail?.manifest?.capsules ?? [], [detail?.manifest]);
    const capsule = capsules.find((item) => item.id === selectedId) ?? capsules[0];
    const artifactKeys = useMemo(() => revision_paths(capsule), [capsule]);
    const { data: urls } = useProductDiffArtifacts(projectId, productDiffId, artifactKeys);

    const controlHash = capsule ? capsule_control_hash(defaults_with(capsule, controlValues)) : "";

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
            <FiRefreshCw />
            Retry
        </Button>
    );

    if (!productDiffId) {
        return (
            <Shell>
                <DiffStatus
                    title="No preview yet"
                    body="A preview is built once the agent opens a frontend pull request for this issue."
                />
            </Shell>
        );
    }

    if (!detail) {
        return (
            <Shell>
                <LogoLoader className="h-full w-full text-snow" />
            </Shell>
        );
    }

    if (detail.status === "Pending" || detail.status === "Generating") {
        return (
            <Shell>
                <DiffStatus
                    title={detail.status === "Pending" ? "Queued" : "Building"}
                    body="Both revisions of every changed component are compiling in a clean sandbox. This updates on its own."
                />
            </Shell>
        );
    }

    if (detail.status === "Unsupported") {
        return (
            <Shell>
                <DiffStatus
                    title="Nothing to preview"
                    body={detail.error ?? "This pull request changes no previewable components."}
                />
            </Shell>
        );
    }

    if (detail.status === "Failed" || detail.status === "Stale") {
        return (
            <Shell>
                <DiffStatus
                    title={detail.status === "Stale" ? "Out of date" : "Preview failed"}
                    body={detail.error ?? "The pull request changed after this preview was built."}
                    action={retry}
                />
            </Shell>
        );
    }

    if (!capsule) {
        return (
            <Shell>
                <DiffStatus
                    title="Nothing rendered"
                    body="No component in this pull request could be rendered on its own."
                    action={retry}
                />
            </Shell>
        );
    }

    return (
        <Shell>
            <CapsuleHeader
                capsule={capsule}
                total={capsules.length}
                baseSha={detail.baseSha}
                headSha={detail.headSha}
            />
            <div className="flex min-h-0 flex-1 gap-6">
                {capsules.length > 1 && (
                    <aside className="w-56 shrink-0">
                        <CapsuleList
                            capsules={capsules}
                            selectedId={capsule.id}
                            onSelect={handleSelect}
                        />
                    </aside>
                )}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
                    <CapsuleControls
                        controls={capsule.controls}
                        values={controlValues}
                        onChange={(name, value) =>
                            setControlValues((current) => ({ ...current, [name]: value }))
                        }
                    />
                    <CapsuleComparison
                        capsule={capsule}
                        urls={urls ?? {}}
                        controlHash={controlHash}
                        viewport={viewport}
                        onViewportChange={setViewport}
                        mode={mode}
                        onModeChange={setMode}
                    />
                </div>
            </div>
            {detail.manifest && detail.manifest.warnings.length > 0 && (
                <ul className="mt-4 flex flex-col gap-1 border-t border-white/5 pt-3">
                    {detail.manifest.warnings.map((warning) => (
                        <li key={warning} className="text-[11px] text-neutral-500">
                            {warning}
                        </li>
                    ))}
                </ul>
            )}
        </Shell>
    );
}

function revision_paths(capsule: Capsule | undefined): string[] {
    if (!capsule) return [];
    return [capsule.base?.path, capsule.head?.path].filter(
        (path): path is string => path !== undefined,
    );
}

function defaults_with(capsule: Capsule, values: Record<string, string>) {
    const merged: Record<string, string> = {};
    for (const control of capsule.controls) {
        merged[control.name] = values[control.name] ?? String(control.default);
    }
    return merged;
}

function Shell({ children }: { children: ReactNode }) {
    return <div className="flex min-h-0 min-w-0 flex-1 flex-col px-4 pt-3 pb-4">{children}</div>;
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
