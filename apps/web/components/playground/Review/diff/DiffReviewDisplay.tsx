"use client";
import {
    is_replay_product_diff_manifest,
    is_screenshot_product_review_manifest,
} from "@trymatcha/types";
import { type ReactNode, useMemo, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";

import LogoLoader from "@/components/app/LogoLoader";
import { PaneActionsSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useProductDiff, useProductDiffReplayLaunch } from "@/hooks/project/useProductDiff";
import { useProductDiffArtifacts } from "@/hooks/project/useProductDiffArtifacts";
import { useRegenerateProductDiff } from "@/hooks/project/useRegenerateProductDiff";
import { useActiveProject } from "@/hooks/useActiveProject";
import {
    default_replay_selection,
    has_launchable_replay_surface,
    select_replay_artifacts,
    select_replay_state,
    select_replay_surface,
    select_replay_viewport,
} from "@/lib/product-diff-replay";

import DiffComparison from "./DiffComparison";
import ReplayComparison from "./ReplayComparison";
import ReplaySurfaceCatalog from "./ReplaySurfaceCatalog";

const OUTCOME_SUFFIX: Record<string, string> = {
    Added: " · added",
    Removed: " · removed",
    Unavailable: " · unavailable",
};

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

    const [targetId, setTargetId] = useState("");
    const [stateId, setStateId] = useState("");
    const [replayApplicationId, setReplayApplicationId] = useState("");
    const [replaySurfaceId, setReplaySurfaceId] = useState("");
    const [replayStateId, setReplayStateId] = useState("");
    const [replayViewportId, setReplayViewportId] = useState("");

    const stored = detail?.manifest ?? null;
    const manifest = is_screenshot_product_review_manifest(stored) ? stored : null;
    const replayManifest = is_replay_product_diff_manifest(stored) ? stored : null;
    const target = manifest?.targets.find((item) => item.id === targetId) ?? manifest?.targets[0];
    const state = target?.states.find((item) => item.id === stateId) ?? target?.states[0];
    const viewport = manifest?.viewports[0];
    const shot = target?.shots.find(
        (item) => item.stateId === state?.id && item.viewportId === viewport?.id,
    );

    const artifactKeys = useMemo(() => {
        if (!target) return [];
        return target.shots
            .flatMap((item) => [item.baseKey, item.headKey])
            .filter((key): key is string => key !== null);
    }, [target]);
    const { data: artifactUrls = {} } = useProductDiffArtifacts(
        projectId,
        productDiffId,
        artifactKeys,
    );

    const defaultReplaySelection = useMemo(
        () => (replayManifest ? default_replay_selection(replayManifest) : undefined),
        [replayManifest],
    );
    const activeReplaySelection = {
        applicationId: replayApplicationId || defaultReplaySelection?.applicationId || "",
        surfaceId: replaySurfaceId || defaultReplaySelection?.surfaceId || "",
        stateId: replayStateId || defaultReplaySelection?.stateId || "",
        viewportId: replayViewportId || defaultReplaySelection?.viewportId || "",
    };
    const replaySurface = replayManifest
        ? select_replay_surface(replayManifest, activeReplaySelection)
        : undefined;
    const replayState = select_replay_state(replaySurface, activeReplaySelection.stateId);
    const replayViewport = select_replay_viewport(replayState, activeReplaySelection.viewportId);
    const replayArtifacts = replayManifest
        ? select_replay_artifacts(replayManifest, activeReplaySelection)
        : undefined;
    const baseReplay = useProductDiffReplayLaunch(
        projectId,
        productDiffId,
        replayArtifacts?.base.artifactKey ?? null,
    );
    const headReplay = useProductDiffReplayLaunch(
        projectId,
        productDiffId,
        replayArtifacts?.head.artifactKey ?? null,
    );

    function handleTargetChange(nextId: string) {
        const next = manifest?.targets.find((item) => item.id === nextId);
        setTargetId(nextId);
        setStateId(next?.states[0]?.id ?? "");
    }

    function handleRegenerate() {
        if (!projectId) return;
        regenerate.mutate({ projectId, issueId });
    }

    function handleReplayApplicationChange(applicationId: string) {
        const surface = replayManifest?.surfaces.find(
            (item) => item.applicationId === applicationId,
        );
        const state = surface?.states[0];
        const viewport = state?.viewports[0];
        setReplayApplicationId(applicationId);
        setReplaySurfaceId(surface?.id ?? "");
        setReplayStateId(state?.id ?? "");
        setReplayViewportId(viewport?.id ?? "");
    }

    function handleReplaySurfaceChange(surfaceId: string) {
        const surface = replayManifest?.surfaces.find(
            (item) =>
                item.applicationId === activeReplaySelection.applicationId && item.id === surfaceId,
        );
        const state = surface?.states[0];
        const viewport = state?.viewports[0];
        setReplaySurfaceId(surfaceId);
        setReplayStateId(state?.id ?? "");
        setReplayViewportId(viewport?.id ?? "");
    }

    function handleReplayStateChange(nextStateId: string) {
        const state = replaySurface?.states.find((item) => item.id === nextStateId);
        setReplayStateId(nextStateId);
        setReplayViewportId(state?.viewports[0]?.id ?? "");
    }

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col px-6 py-5">
            <PaneActionsSlot>
                <div className="flex items-center gap-2">
                    {manifest && target && manifest.targets.length > 1 && (
                        <Picker
                            value={target.id}
                            onChange={handleTargetChange}
                            options={manifest.targets.map((item) => ({
                                value: item.id,
                                label: `${item.label}${OUTCOME_SUFFIX[item.outcome] ?? ""}`,
                            }))}
                        />
                    )}
                    {target && state && target.states.length > 1 && (
                        <Picker
                            value={state.id}
                            onChange={setStateId}
                            options={target.states.map((item) => ({
                                value: item.id,
                                label: item.label,
                            }))}
                        />
                    )}
                </div>
            </PaneActionsSlot>

            {!productDiffId && (
                <DiffStatus
                    title="No diff yet"
                    body="A diff is captured once the agent opens a frontend pull request for this issue."
                />
            )}
            {productDiffId && !detail && <LogoLoader className="h-full w-full text-snow" />}
            {detail && detail.status === "Pending" && (
                <DiffStatus
                    title="Queued"
                    body="A sandbox is about to build both revisions and prepare their review artifacts."
                />
            )}
            {detail && detail.status === "Generating" && (
                <DiffStatus
                    title="Preparing review"
                    body="Both revisions are building in a clean sandbox. This updates on its own."
                />
            )}
            {detail && detail.status === "Unsupported" && (
                <DiffStatus
                    title="Not supported yet"
                    body={detail.error ?? "Diffs currently cover Next.js projects only."}
                />
            )}
            {detail && detail.status === "ConfigurationRequired" && (
                <DiffStatus
                    title="Needs preview setup"
                    body={
                        detail.diagnostics?.message ??
                        detail.error ??
                        "This project needs preview configuration before a visual diff can be captured."
                    }
                />
            )}
            {detail && detail.status === "PreviewUnavailable" && (
                <DiffStatus
                    title="Preview could not start"
                    body={
                        detail.diagnostics?.message ??
                        detail.error ??
                        "The preview could not start in its sandbox. Try again after checking the project setup."
                    }
                    action={
                        <Button size="sm" loading={regenerate.isPending} onClick={handleRegenerate}>
                            <FiRefreshCw />
                            Retry
                        </Button>
                    }
                />
            )}
            {detail && (detail.status === "Failed" || detail.status === "Stale") && (
                <DiffStatus
                    title={detail.status === "Stale" ? "Out of date" : "Capture failed"}
                    body={detail.error ?? "The pull request changed after this diff was taken."}
                    action={
                        <Button size="sm" loading={regenerate.isPending} onClick={handleRegenerate}>
                            <FiRefreshCw />
                            {detail.status === "Stale" ? "Regenerate" : "Retry"}
                        </Button>
                    }
                />
            )}
            {detail && detail.status === "Ready" && !manifest && !replayManifest && (
                <DiffStatus
                    title="Captured in an older format"
                    body="This diff predates screenshot capture. Regenerate it to see the real components."
                    action={
                        <Button size="sm" loading={regenerate.isPending} onClick={handleRegenerate}>
                            <FiRefreshCw />
                            Regenerate
                        </Button>
                    }
                />
            )}
            {detail && detail.status === "Ready" && replayManifest && (
                <div className="flex min-h-0 flex-1 flex-col">
                    <ReplaySurfaceCatalog
                        manifest={replayManifest}
                        selection={activeReplaySelection}
                        onApplicationChange={handleReplayApplicationChange}
                        onSurfaceChange={handleReplaySurfaceChange}
                        onStateChange={handleReplayStateChange}
                        onViewportChange={setReplayViewportId}
                    />
                    {!has_launchable_replay_surface(replayManifest) && (
                        <DiffStatus
                            title="Interactive replay is unavailable"
                            body="No launchable Base or Head replay was captured. Regenerate the diff after checking the preview setup."
                            action={
                                <Button
                                    size="sm"
                                    loading={regenerate.isPending}
                                    onClick={handleRegenerate}
                                >
                                    <FiRefreshCw />
                                    Regenerate
                                </Button>
                            }
                        />
                    )}
                    {has_launchable_replay_surface(replayManifest) &&
                        replayViewport &&
                        replayArtifacts && (
                            <ReplayComparison
                                base={replayArtifacts.base}
                                head={replayArtifacts.head}
                                baseLaunchUrl={baseReplay.data?.url}
                                headLaunchUrl={headReplay.data?.url}
                                isLoading={baseReplay.isPending || headReplay.isPending}
                            />
                        )}
                    {has_launchable_replay_surface(replayManifest) && !replayViewport && (
                        <DiffStatus
                            title="No replay surface selected"
                            body="Choose a surface, state, and viewport with a captured replay."
                        />
                    )}
                </div>
            )}
            {detail && detail.status === "Ready" && manifest && shot && (
                <DiffComparison shot={shot} urls={artifactUrls} />
            )}
            {detail && detail.status === "Ready" && manifest && !shot && (
                <DiffStatus
                    title="Nothing captured"
                    body="No screenshot exists for this component and state."
                />
            )}
        </div>
    );
}

function Picker({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (next: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger size="sm" className="max-w-52 text-[14px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
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
