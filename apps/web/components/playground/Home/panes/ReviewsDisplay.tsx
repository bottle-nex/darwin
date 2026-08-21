"use client";

import { useMemo, useState } from "react";
import { FiExternalLink, FiGitPullRequest, FiRefreshCw } from "react-icons/fi";
import {
    is_product_diff_manifest_v2,
    type ProductDiffShot,
    type ProductDiffViewport,
} from "@trymatcha/types";
import { Button } from "@/components/ui/button";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useProductDiff } from "@/hooks/project/useProductDiff";
import { useProductDiffArtifacts } from "@/hooks/project/useProductDiffArtifacts";
import { useProductDiffs } from "@/hooks/project/useProductDiffs";
import { useRegenerateProductDiff } from "@/hooks/project/useRegenerateProductDiff";
import { cn } from "@/lib/utils";

const SELECT =
    "h-8 rounded-md border border-white/10 bg-white/5 px-2 text-[11px] text-neutral-200 outline-none focus:border-primary/50";
const LEGACY_VIEWPORTS = {
    Desktop: "100%",
    Tablet: "768px",
    Mobile: "390px",
} as const;

const COMPARE_MODES = [
    { id: "split", label: "Side by side" },
    { id: "overlay", label: "Overlay" },
    { id: "diff", label: "Diff only" },
] as const;
type CompareMode = (typeof COMPARE_MODES)[number]["id"];

const OUTCOME_SUFFIX: Record<string, string> = {
    Added: " · added",
    Removed: " · removed",
    Unavailable: " · unavailable",
};

function change_tone(percentage: number | null): string {
    if (percentage === null) return "border-white/10 bg-white/5 text-neutral-400";
    if (percentage < 0.1) return "border-emerald-400/20 bg-emerald-400/8 text-emerald-200";
    if (percentage < 5) return "border-amber-400/20 bg-amber-400/8 text-amber-200";
    return "border-rose-400/20 bg-rose-400/8 text-rose-200";
}

function change_label(shot: ProductDiffShot | undefined): string {
    if (!shot) return "no capture";
    if (shot.outcome === "Added") return "added in this PR";
    if (shot.outcome === "Removed") return "removed in this PR";
    if (shot.outcome === "Unavailable") return "could not render";
    if (shot.diffPercentage === null) return "not compared";
    return `${shot.diffPercentage.toFixed(2)}% changed`;
}

export default function ReviewsDisplay() {
    const project = useActiveProject();
    const { data: diffs = [], isPending: listPending } = useProductDiffs(project?.id);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selected = diffs.some((diff) => diff.id === selectedId)
        ? selectedId
        : (diffs[0]?.id ?? null);
    const { data: detail, isPending: detailPending } = useProductDiff(project?.id, selected);
    const regenerate = useRegenerateProductDiff();

    const [targetId, setTargetId] = useState("");
    const [stateId, setStateId] = useState("");
    const [viewportId, setViewportId] = useState("");
    const [mode, setMode] = useState<CompareMode>("split");
    const [overlay, setOverlay] = useState(100);

    const stored = detail?.manifest ?? null;
    const manifest = is_product_diff_manifest_v2(stored) ? stored : null;
    const target = manifest?.targets.find((item) => item.id === targetId) ?? manifest?.targets[0];
    const state = target?.states.find((item) => item.id === stateId) ?? target?.states[0];
    const viewport: ProductDiffViewport | undefined =
        manifest?.viewports.find((item) => item.id === viewportId) ?? manifest?.viewports[0];
    const shot = target?.shots.find(
        (item) => item.stateId === state?.id && item.viewportId === viewport?.id,
    );

    const keys = useMemo(() => {
        if (!target) return [];
        return target.shots
            .flatMap((item) => [item.baseKey, item.headKey, item.diffKey])
            .filter((key): key is string => key !== null);
    }, [target]);
    const { data: urls = {} } = useProductDiffArtifacts(project?.id, selected, keys);

    function changeTarget(nextId: string) {
        const next = manifest?.targets.find((item) => item.id === nextId);
        setTargetId(nextId);
        setStateId(next?.states[0]?.id ?? "");
    }

    return (
        <div className="grid h-full min-h-0 grid-cols-[230px_1fr] bg-[#11110f] text-neutral-100">
            <aside className="min-h-0 overflow-y-auto border-r border-white/7 bg-black/15 p-2">
                <div className="px-2 py-3">
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-600 uppercase">
                        Product diffs
                    </p>
                </div>
                {listPending && <p className="px-2 text-[11px] text-neutral-500">Loading…</p>}
                {!listPending && diffs.length === 0 && (
                    <p className="px-2 text-[11px] leading-relaxed text-neutral-500">
                        No frontend Product Diff available.
                    </p>
                )}
                <div className="space-y-1">
                    {diffs.map((diff) => (
                        <button
                            key={diff.id}
                            type="button"
                            onClick={() => setSelectedId(diff.id)}
                            className={cn(
                                "w-full rounded-md border p-2.5 text-left",
                                selected === diff.id
                                    ? "border-primary/25 bg-primary/10"
                                    : "border-transparent hover:bg-white/4",
                            )}
                        >
                            <p className="text-[10px] text-primary">
                                #{diff.issueNumber} · {diff.status.toUpperCase()}
                            </p>
                            <p className="mt-1 truncate text-[11px] font-medium text-neutral-200">
                                {diff.issueTitle}
                            </p>
                            <p className="mt-1 font-mono text-[9px] text-neutral-600">
                                {diff.headSha.slice(0, 7)}
                            </p>
                        </button>
                    ))}
                </div>
            </aside>

            <section className="flex min-h-0 min-w-0 flex-col">
                {!selected && (
                    <div className="flex flex-1 items-center justify-center text-[12px] text-neutral-500">
                        Product Diff appears here after an eligible frontend PR.
                    </div>
                )}
                {selected && (detailPending || !detail) && (
                    <div className="flex flex-1 items-center justify-center text-[12px] text-neutral-500">
                        Loading Product Diff…
                    </div>
                )}
                {detail && (
                    <>
                        <header className="border-b border-white/7 px-5 py-4">
                            <div className="flex items-start justify-between gap-5">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                                        <FiGitPullRequest />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold tracking-[0.16em] text-primary uppercase">
                                            Product review studio
                                        </p>
                                        <h1 className="truncate text-base font-medium">
                                            #{detail.issueNumber} · {detail.issueTitle}
                                        </h1>
                                        <p className="font-mono text-[9px] text-neutral-600">
                                            {detail.baseSha.slice(0, 7)} /{" "}
                                            {detail.headSha.slice(0, 7)}
                                        </p>
                                    </div>
                                </div>
                                <Button asChild variant="secondary" size="sm">
                                    <a href={detail.prUrl} target="_blank" rel="noreferrer">
                                        <FiExternalLink /> Open PR
                                    </a>
                                </Button>
                            </div>

                            {detail.status === "Ready" &&
                                manifest &&
                                target &&
                                state &&
                                viewport && (
                                    <div className="mt-4 flex flex-wrap items-center gap-3">
                                        <label className="flex items-center gap-2 text-[11px] text-neutral-500">
                                            Target
                                            <select
                                                className={SELECT}
                                                value={target.id}
                                                onChange={(event) =>
                                                    changeTarget(event.target.value)
                                                }
                                            >
                                                {manifest.targets.map((item) => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.label}
                                                        {OUTCOME_SUFFIX[item.outcome] ?? ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="flex items-center gap-2 text-[11px] text-neutral-500">
                                            State
                                            <select
                                                className={SELECT}
                                                value={state.id}
                                                onChange={(event) => setStateId(event.target.value)}
                                            >
                                                {target.states.map((item) => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="flex items-center gap-2 text-[11px] text-neutral-500">
                                            Viewport
                                            <select
                                                className={SELECT}
                                                value={viewport.id}
                                                onChange={(event) =>
                                                    setViewportId(event.target.value)
                                                }
                                            >
                                                {manifest.viewports.map((item) => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.label} · {item.width}×{item.height}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <div className="flex overflow-hidden rounded-md border border-white/10">
                                            {COMPARE_MODES.map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setMode(item.id)}
                                                    className={cn(
                                                        "px-2.5 py-1.5 text-[11px]",
                                                        mode === item.id
                                                            ? "bg-primary/15 text-primary"
                                                            : "text-neutral-400 hover:bg-white/5",
                                                    )}
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                        <span
                                            className={cn(
                                                "rounded-full border px-2.5 py-1 text-[10px]",
                                                change_tone(shot?.diffPercentage ?? null),
                                            )}
                                        >
                                            {change_label(shot)}
                                        </span>
                                        <span className="ml-auto rounded-full border border-emerald-400/20 bg-emerald-400/8 px-2.5 py-1 text-[10px] text-emerald-200">
                                            Rendered from source · {manifest.framework}
                                        </span>
                                    </div>
                                )}
                        </header>

                        {(detail.status === "Pending" || detail.status === "Generating") && (
                            <Status
                                title="Generating Product Diff"
                                body="A clean sandbox is building both revisions and photographing them. This page refreshes automatically."
                            />
                        )}
                        {detail.status === "Unsupported" && (
                            <Status
                                title="Not supported yet"
                                body={
                                    detail.error ??
                                    "Product Diff currently supports Next.js projects only."
                                }
                            />
                        )}
                        {(detail.status === "Failed" || detail.status === "Stale") && (
                            <Status
                                title={
                                    detail.status === "Stale"
                                        ? "Product Diff is stale"
                                        : "Generation failed"
                                }
                                body={
                                    detail.error ?? "The PR changed or generation could not finish."
                                }
                                action={
                                    <Button
                                        size="sm"
                                        loading={regenerate.isPending}
                                        onClick={() =>
                                            project &&
                                            regenerate.mutate(
                                                { projectId: project.id, issueId: detail.issueId },
                                                { onSuccess: ({ id }) => setSelectedId(id) },
                                            )
                                        }
                                    >
                                        <FiRefreshCw />{" "}
                                        {detail.status === "Stale" ? "Regenerate" : "Retry"}
                                    </Button>
                                }
                            />
                        )}
                        {detail.status === "Ready" && manifest && (
                            <main className="min-h-0 flex-1 overflow-auto p-4">
                                {shot ? (
                                    <Triptych
                                        shot={shot}
                                        urls={urls}
                                        mode={mode}
                                        overlay={overlay}
                                        onOverlayChange={setOverlay}
                                    />
                                ) : (
                                    <p className="text-[11px] text-neutral-500">
                                        Nothing was captured for this combination.
                                    </p>
                                )}
                                {manifest.warnings.map((warning) => (
                                    <p key={warning} className="mt-2 text-[10px] text-amber-300/80">
                                        {warning}
                                    </p>
                                ))}
                            </main>
                        )}
                        {detail.status === "Ready" &&
                            !manifest &&
                            detail.baseUrl &&
                            detail.headUrl && (
                                <LegacyPreview baseUrl={detail.baseUrl} headUrl={detail.headUrl} />
                            )}
                    </>
                )}
            </section>
        </div>
    );
}

function Status({
    title,
    body,
    action,
}: {
    title: string;
    body: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <h2 className="text-sm font-medium text-neutral-200">{title}</h2>
            <p className="max-w-md text-[11px] leading-relaxed text-neutral-500">{body}</p>
            {action}
        </div>
    );
}

function Shot({ title, src, absent }: { title: string; src: string | undefined; absent: string }) {
    return (
        <article className="min-w-0 overflow-hidden rounded-lg border border-white/8 bg-white/[0.025]">
            <div className="border-b border-white/7 px-3 py-2 text-[10px] font-medium text-neutral-400">
                {title}
            </div>
            <div className="flex min-h-[220px] items-start justify-center bg-neutral-900 p-2">
                {src ? (
                    <img src={src} alt={title} className="max-w-full" />
                ) : (
                    <p className="self-center text-[11px] text-neutral-500">{absent}</p>
                )}
            </div>
        </article>
    );
}

function Triptych({
    shot,
    urls,
    mode,
    overlay,
    onOverlayChange,
}: {
    shot: ProductDiffShot;
    urls: Record<string, string>;
    mode: CompareMode;
    overlay: number;
    onOverlayChange: (value: number) => void;
}) {
    const base = shot.baseKey ? urls[shot.baseKey] : undefined;
    const head = shot.headKey ? urls[shot.headKey] : undefined;
    const diff = shot.diffKey ? urls[shot.diffKey] : undefined;

    if (mode === "diff") {
        return (
            <Shot
                title="What changed"
                src={diff}
                absent={shot.error ?? "No visual change between the two revisions."}
            />
        );
    }

    if (mode === "overlay") {
        return (
            <div className="space-y-3">
                <div className="relative overflow-hidden rounded-lg border border-white/8 bg-neutral-900">
                    {base && <img src={base} alt="Base" className="max-w-full" />}
                    {head && (
                        <img
                            src={head}
                            alt="Head"
                            className="absolute inset-0 max-w-full"
                            style={{ opacity: overlay / 100 }}
                        />
                    )}
                    {!base && !head && (
                        <p className="p-6 text-[11px] text-neutral-500">Nothing to overlay.</p>
                    )}
                </div>
                <label className="flex items-center gap-3 text-[11px] text-neutral-500">
                    Base
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={overlay}
                        onChange={(event) => onOverlayChange(Number(event.target.value))}
                        className="h-1 flex-1 accent-primary"
                    />
                    Head
                </label>
            </div>
        );
    }

    return (
        <div className="grid min-w-[720px] grid-cols-3 gap-4">
            <Shot title="Base" src={base} absent="Added in this PR" />
            <Shot title="Head" src={head} absent="Removed in this PR" />
            <Shot
                title="What changed"
                src={diff}
                absent={shot.error ?? "No visual change between the two revisions."}
            />
        </div>
    );
}

function LegacyPreview({ baseUrl, headUrl }: { baseUrl: string; headUrl: string }) {
    return (
        <main className="min-h-0 flex-1 overflow-auto p-4">
            <p className="mb-3 text-[10px] text-amber-300/80">
                This preview was generated with an older approximation-based format. Regenerate it
                to get screenshots of the real components.
            </p>
            <div className="grid min-w-[720px] grid-cols-2 gap-4">
                {[
                    { title: "Base", url: baseUrl },
                    { title: "Head", url: headUrl },
                ].map((frame) => (
                    <article
                        key={frame.title}
                        className="min-w-0 overflow-hidden rounded-lg border border-white/8 bg-white/[0.025]"
                    >
                        <div className="border-b border-white/7 px-3 py-2 text-[10px] font-medium text-neutral-400">
                            {frame.title}
                        </div>
                        <div className="h-[560px] overflow-auto bg-neutral-900 p-2">
                            <iframe
                                src={frame.url}
                                sandbox="allow-scripts"
                                title={`${frame.title} Product Diff`}
                                style={{ width: LEGACY_VIEWPORTS.Desktop, maxWidth: "100%" }}
                                className="mx-auto h-full border-0 bg-white"
                            />
                        </div>
                    </article>
                ))}
            </div>
        </main>
    );
}
