"use client";

import { useMemo, useState } from "react";
import { FiExternalLink, FiGitPullRequest, FiRefreshCw } from "react-icons/fi";
import {
    is_screenshot_product_review_manifest,
    type ProductDiffShot,
    type ProductReviewShot,
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

const OUTCOME_SUFFIX: Record<string, string> = {
    Added: " · added",
    Removed: " · removed",
    Unavailable: " · unavailable",
};

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

    const stored = detail?.manifest ?? null;
    const manifest = is_screenshot_product_review_manifest(stored) ? stored : null;
    const target = manifest?.targets.find((item) => item.id === targetId) ?? manifest?.targets[0];
    const state = target?.states.find((item) => item.id === stateId) ?? target?.states[0];
    const viewport = manifest?.viewports[0];
    const shot = target?.shots.find(
        (item) => item.stateId === state?.id && item.viewportId === viewport?.id,
    );

    const keys = useMemo(() => {
        if (!target) return [];
        return target.shots
            .flatMap((item) => [item.baseKey, item.headKey])
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
                        Product reviews
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
                                        <span className="text-[11px] text-neutral-500">
                                            Desktop · {viewport.width}×{viewport.height}
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
                                    <ScreenshotPair shot={shot} urls={urls} />
                                ) : (
                                    <p className="text-[11px] text-neutral-500">
                                        Nothing was captured for this combination.
                                    </p>
                                )}
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

function ScreenshotPair({
    shot,
    urls,
}: {
    shot: ProductDiffShot | ProductReviewShot;
    urls: Record<string, string>;
}) {
    const base = shot.baseKey ? urls[shot.baseKey] : undefined;
    const head = shot.headKey ? urls[shot.headKey] : undefined;

    return (
        <div className="grid min-w-[560px] grid-cols-2 gap-4">
            <Shot title="Before" src={base} absent={shot.error ?? "Added in this PR"} />
            <Shot title="After" src={head} absent={shot.error ?? "Removed in this PR"} />
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
