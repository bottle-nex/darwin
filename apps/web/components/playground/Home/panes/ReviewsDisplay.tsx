"use client";

import { useEffect, useRef, useState } from "react";
import { FiExternalLink, FiGitPullRequest, FiRefreshCw } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useProductDiff } from "@/hooks/project/useProductDiff";
import { useProductDiffs } from "@/hooks/project/useProductDiffs";
import { useRegenerateProductDiff } from "@/hooks/project/useRegenerateProductDiff";
import { cn } from "@/lib/utils";

const SELECT =
    "h-8 rounded-md border border-white/10 bg-white/5 px-2 text-[11px] text-neutral-200 outline-none focus:border-primary/50";

const VIEWPORTS = {
    Desktop: "100%",
    Tablet: "768px",
    Mobile: "390px",
} as const;

function postState(frame: HTMLIFrameElement | null, targetId?: string, stateId?: string) {
    if (!targetId || !stateId) return;
    frame?.contentWindow?.postMessage({ type: "product-diff-state", targetId, stateId }, "*");
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
    const [viewport, setViewport] = useState<keyof typeof VIEWPORTS>("Desktop");
    const baseFrame = useRef<HTMLIFrameElement>(null);
    const headFrame = useRef<HTMLIFrameElement>(null);

    const target =
        detail?.manifest?.targets.find((item) => item.id === targetId) ??
        detail?.manifest?.targets[0];
    const state = target?.states.find((item) => item.id === stateId) ?? target?.states[0];

    useEffect(() => {
        postState(baseFrame.current, target?.id, state?.id);
        postState(headFrame.current, target?.id, state?.id);
    }, [state?.id, target?.id]);

    function changeTarget(nextId: string) {
        const next = detail?.manifest?.targets.find((item) => item.id === nextId);
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

                            {detail.status === "Ready" && target && state && (
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <label className="flex items-center gap-2 text-[11px] text-neutral-500">
                                        Target
                                        <select
                                            className={SELECT}
                                            value={target.id}
                                            onChange={(event) => changeTarget(event.target.value)}
                                        >
                                            {detail.manifest?.targets.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.label}
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
                                            value={viewport}
                                            onChange={(event) =>
                                                setViewport(
                                                    event.target.value as keyof typeof VIEWPORTS,
                                                )
                                            }
                                        >
                                            {Object.keys(VIEWPORTS).map((name) => (
                                                <option key={name}>{name}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <span className="ml-auto rounded-full border border-amber-400/20 bg-amber-400/8 px-2.5 py-1 text-[10px] text-amber-200">
                                        Visual approximation
                                    </span>
                                </div>
                            )}
                        </header>

                        {(detail.status === "Pending" || detail.status === "Generating") && (
                            <Status
                                title="Generating Product Diff"
                                body="One clean preview sandbox is working. This page refreshes automatically."
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
                                                {
                                                    projectId: project.id,
                                                    issueId: detail.issueId,
                                                },
                                                {
                                                    onSuccess: ({ id }) => setSelectedId(id),
                                                },
                                            )
                                        }
                                    >
                                        <FiRefreshCw />{" "}
                                        {detail.status === "Stale" ? "Regenerate" : "Retry"}
                                    </Button>
                                }
                            />
                        )}
                        {detail.status === "Ready" && detail.baseUrl && detail.headUrl && (
                            <main className="min-h-0 flex-1 overflow-auto p-4">
                                <div className="grid min-w-[720px] grid-cols-2 gap-4">
                                    <Preview
                                        title="Base"
                                        url={detail.baseUrl}
                                        frameRef={baseFrame}
                                        width={VIEWPORTS[viewport]}
                                        onLoad={() =>
                                            postState(baseFrame.current, target?.id, state?.id)
                                        }
                                    />
                                    <Preview
                                        title="Head"
                                        url={detail.headUrl}
                                        frameRef={headFrame}
                                        width={VIEWPORTS[viewport]}
                                        onLoad={() =>
                                            postState(headFrame.current, target?.id, state?.id)
                                        }
                                    />
                                </div>
                                {detail.manifest?.warnings.map((warning) => (
                                    <p key={warning} className="mt-2 text-[10px] text-amber-300/80">
                                        {warning}
                                    </p>
                                ))}
                            </main>
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

function Preview({
    title,
    url,
    frameRef,
    width,
    onLoad,
}: {
    title: string;
    url: string;
    frameRef: React.RefObject<HTMLIFrameElement | null>;
    width: string;
    onLoad: () => void;
}) {
    return (
        <article className="min-w-0 overflow-hidden rounded-lg border border-white/8 bg-white/[0.025]">
            <div className="border-b border-white/7 px-3 py-2 text-[10px] font-medium text-neutral-400">
                {title}
            </div>
            <div className="h-[560px] overflow-auto bg-neutral-900 p-2">
                <iframe
                    ref={frameRef}
                    src={url}
                    sandbox="allow-scripts"
                    title={`${title} Product Diff`}
                    onLoad={onLoad}
                    style={{ width, maxWidth: "100%" }}
                    className="mx-auto h-full border-0 bg-white"
                />
            </div>
        </article>
    );
}
