"use client";

// PROTOTYPE — three Product Diff workspace variants on the existing Reviews pane.
// Switch with ?variant=A|B|C. Throw away after the product decision is captured.

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    FiArrowLeft,
    FiArrowRight,
    FiCheck,
    FiCode,
    FiExternalLink,
    FiGitPullRequest,
    FiMessageSquare,
    FiRefreshCw,
    FiShield,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VariantKey = "A" | "B" | "C";
type PreviewState = "Default" | "Snoozed" | "Empty";
type Viewport = "Desktop" | "Tablet" | "Mobile";
type Verdict = "COMMENT" | "APPROVE" | "REQUEST_CHANGES";

type PrototypeState = {
    previewState: PreviewState;
    viewport: Viewport;
    draft: string;
    anchor: string | null;
    verdict: Verdict;
    submitted: boolean;
};

type PrototypeActions = {
    setPreviewState: (value: PreviewState) => void;
    setViewport: (value: Viewport) => void;
    setDraft: (value: string) => void;
    setAnchor: (value: string | null) => void;
    setVerdict: (value: Verdict) => void;
    submit: () => void;
};

type VariantProps = {
    state: PrototypeState;
    actions: PrototypeActions;
};

const VARIANTS: Array<{ key: VariantKey; name: string }> = [
    { key: "A", name: "Evidence desk" },
    { key: "B", name: "Product studio" },
    { key: "C", name: "Guided review" },
];

const SELECT_CLASS =
    "h-8 rounded-md border border-white/10 bg-white/5 px-2 text-[12px] text-neutral-200 outline-none focus:border-primary/50";
const PANEL = "rounded-lg border border-white/8 bg-white/[0.025]";

const evidence = [
    { label: "Agent summary", value: "Added snooze controls and a compact mobile row." },
    { label: "Tests", value: "18 passed · typecheck passed · build passed" },
    { label: "Changed", value: "6 files · +284 −61" },
];

function ReviewHeader({ compact = false }: { compact?: boolean }) {
    return (
        <div className={cn("flex min-w-0 items-center gap-3", compact && "gap-2")}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <FiGitPullRequest className="size-4" />
            </span>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-emerald-300">OPEN</span>
                    <span className="text-[11px] text-neutral-500">#482</span>
                    <span className="truncate text-[11px] text-neutral-500">
                        agent/snooze-inbox → main
                    </span>
                </div>
                <h1
                    className={cn(
                        "truncate font-medium text-neutral-100",
                        compact ? "text-sm" : "text-base",
                    )}
                >
                    Add snooze actions to notification inbox
                </h1>
            </div>
        </div>
    );
}

function PreviewControls({ state, actions }: VariantProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-[11px] text-neutral-500">
                Case
                <select className={SELECT_CLASS} defaultValue="Inbox row">
                    <option>Inbox row</option>
                    <option>Notification drawer</option>
                </select>
            </label>
            <label className="flex items-center gap-2 text-[11px] text-neutral-500">
                State
                <select
                    className={SELECT_CLASS}
                    value={state.previewState}
                    onChange={(event) =>
                        actions.setPreviewState(event.target.value as PreviewState)
                    }
                >
                    <option>Default</option>
                    <option>Snoozed</option>
                    <option>Empty</option>
                </select>
            </label>
            <label className="flex items-center gap-2 text-[11px] text-neutral-500">
                Viewport
                <select
                    className={SELECT_CLASS}
                    value={state.viewport}
                    onChange={(event) => actions.setViewport(event.target.value as Viewport)}
                >
                    <option>Desktop</option>
                    <option>Tablet</option>
                    <option>Mobile</option>
                </select>
            </label>
        </div>
    );
}

function MockInbox({ side, previewState }: { side: "Base" | "Head"; previewState: PreviewState }) {
    const isHead = side === "Head";

    return (
        <div className="h-full bg-[#f5f5f3] p-3 font-sans text-[#262626]">
            <div className="mb-3 flex items-center justify-between border-b border-black/8 pb-2">
                <div>
                    <p className="text-[9px] font-semibold tracking-[0.18em] text-[#6d6d68] uppercase">
                        Matcha
                    </p>
                    <p className="text-[13px] font-semibold">Notifications</p>
                </div>
                <span className="rounded-full bg-[#ddd9ff] px-2 py-0.5 text-[8px] font-semibold text-[#51458f]">
                    3 unread
                </span>
            </div>

            {previewState === "Empty" ? (
                <div className="flex h-[75%] flex-col items-center justify-center text-center">
                    <span className="mb-2 flex size-8 items-center justify-center rounded-full bg-black/5">
                        ✓
                    </span>
                    <p className="text-[11px] font-semibold">You are caught up</p>
                    <p className="mt-1 text-[8px] text-[#777]">New notifications appear here.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="rounded-lg border border-black/8 bg-white p-2 shadow-xs">
                        <div className="flex items-start gap-2">
                            <span className="mt-0.5 size-5 shrink-0 rounded-md bg-[#d9f3df]" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-[10px] font-semibold">
                                        Design review requested
                                    </p>
                                    <span className="text-[7px] text-[#888]">2m</span>
                                </div>
                                <p className="mt-0.5 line-clamp-2 text-[8px] leading-relaxed text-[#6b6b66]">
                                    Priya mentioned you in Product review command center.
                                </p>
                                {isHead && (
                                    <div className="mt-2 flex items-center gap-1.5">
                                        <button className="rounded bg-[#6254a3] px-2 py-1 text-[7px] font-semibold text-white">
                                            Open
                                        </button>
                                        <button className="rounded border border-black/10 px-2 py-1 text-[7px] font-medium">
                                            Snooze
                                        </button>
                                    </div>
                                )}
                                {previewState === "Snoozed" && isHead && (
                                    <span className="mt-1.5 inline-flex rounded-full bg-[#fff0c9] px-1.5 py-0.5 text-[7px] font-medium text-[#725413]">
                                        Snoozed until tomorrow
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {["Build completed", "New comment on CLS-1042"].map((title) => (
                        <div
                            key={title}
                            className="rounded-lg border border-black/6 bg-white/70 p-2"
                        >
                            <p className="text-[9px] font-medium">{title}</p>
                            <p className="mt-0.5 text-[7px] text-[#888]">A few minutes ago</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PreviewFrame({
    side,
    state,
    onAnchor,
    compact = false,
}: {
    side: "Base" | "Head";
    state: PrototypeState;
    onAnchor: (value: string) => void;
    compact?: boolean;
}) {
    const width =
        state.viewport === "Mobile" ? "48%" : state.viewport === "Tablet" ? "72%" : "100%";

    return (
        <section className={cn(PANEL, "flex min-h-0 flex-col overflow-hidden")}>
            <header className="flex h-8 shrink-0 items-center justify-between border-b border-white/8 px-2.5">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            "size-1.5 rounded-full",
                            side === "Head" ? "bg-primary" : "bg-neutral-500",
                        )}
                    />
                    <span className="text-[11px] font-medium text-neutral-300">{side}</span>
                    <span className="font-mono text-[10px] text-neutral-600">
                        {side === "Head" ? "c84a9d1" : "945c11e"}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-300">
                    <FiShield className="size-3" /> isolated
                </div>
            </header>
            <div
                className={cn(
                    "relative flex min-h-0 flex-1 justify-center bg-black/25 p-2",
                    compact ? "h-48" : "h-72",
                )}
            >
                <div
                    className="h-full overflow-hidden rounded-md bg-white shadow-2xl transition-[width] duration-200"
                    style={{ width }}
                >
                    <MockInbox side={side} previewState={state.previewState} />
                </div>
                {side === "Head" && (
                    <button
                        aria-label="Anchor feedback to snooze action"
                        onClick={() => onAnchor("Head · Inbox row · Snooze action")}
                        className={cn(
                            "absolute top-[54%] left-[62%] flex size-5 items-center justify-center rounded-full border-2 border-white bg-primary text-[9px] font-bold text-[#3B315C] shadow-lg transition-transform hover:scale-110",
                            state.anchor && "ring-4 ring-primary/25",
                        )}
                    >
                        {state.anchor ? "1" : "+"}
                    </button>
                )}
            </div>
        </section>
    );
}

function CodeEvidence({ dense = false }: { dense?: boolean }) {
    const lines = [
        { marker: " ", text: "<NotificationRow notification={item}>" },
        { marker: "+", text: "  <SnoozeButton onSelect={snooze} />" },
        { marker: "+", text: "  <OpenNotification compact={isMobile} />" },
        { marker: " ", text: "</NotificationRow>" },
    ];

    return (
        <div className={cn(PANEL, "overflow-hidden")}>
            <div className="flex h-8 items-center justify-between border-b border-white/8 px-2.5">
                <span className="flex items-center gap-2 text-[11px] font-medium text-neutral-300">
                    <FiCode className="size-3.5" /> NotificationRow.tsx
                </span>
                <span className="text-[10px] text-neutral-600">+42 −8</span>
            </div>
            <div
                className={cn(
                    "overflow-x-auto bg-black/20 py-1 font-mono",
                    dense ? "text-[9px]" : "text-[10px]",
                )}
            >
                {lines.map((line, index) => (
                    <div
                        key={`${line.marker}-${line.text}`}
                        className={cn(
                            "flex min-w-max gap-3 px-2.5 py-1 text-neutral-400",
                            line.marker === "+" && "bg-emerald-500/8 text-emerald-200",
                        )}
                    >
                        <span className="w-4 text-right text-neutral-700">{38 + index}</span>
                        <span className="w-2 text-emerald-400">{line.marker}</span>
                        <span>{line.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FeedbackComposer({
    state,
    actions,
    compact = false,
}: VariantProps & { compact?: boolean }) {
    return (
        <div className={cn(PANEL, "p-3")}>
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[11px] font-medium text-neutral-200">
                    <FiMessageSquare className="size-3.5" /> Rendered feedback
                </span>
                {state.anchor && (
                    <button
                        className="text-[10px] text-neutral-500 hover:text-neutral-300"
                        onClick={() => actions.setAnchor(null)}
                    >
                        Remove anchor
                    </button>
                )}
            </div>
            <div className="mb-2 rounded-md border border-white/8 bg-black/20 px-2 py-1.5 text-[10px] text-neutral-500">
                {state.anchor ?? "Click + inside Head preview to anchor this comment."}
            </div>
            <textarea
                value={state.draft}
                onChange={(event) => actions.setDraft(event.target.value)}
                placeholder="What should change?"
                className={cn(
                    "w-full resize-none rounded-md border border-white/10 bg-white/5 p-2 text-[11px] text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-primary/50",
                    compact ? "h-16" : "h-24",
                )}
            />
        </div>
    );
}

function VerdictControls({
    state,
    actions,
    compact = false,
}: VariantProps & { compact?: boolean }) {
    const verdicts: Array<{ value: Verdict; label: string }> = [
        { value: "COMMENT", label: "Comment" },
        { value: "APPROVE", label: "Approve" },
        { value: "REQUEST_CHANGES", label: "Request changes" },
    ];

    return (
        <div className={cn(PANEL, "p-3")}>
            <p className="mb-2 text-[11px] font-medium text-neutral-200">GitHub verdict</p>
            <div className={cn("grid gap-1.5", compact ? "grid-cols-3" : "grid-cols-1")}>
                {verdicts.map((item) => (
                    <button
                        key={item.value}
                        onClick={() => actions.setVerdict(item.value)}
                        className={cn(
                            "rounded-md border px-2 py-1.5 text-[10px] transition-colors",
                            state.verdict === item.value
                                ? "border-primary/50 bg-primary/12 text-primary"
                                : "border-white/8 bg-white/[0.025] text-neutral-400 hover:bg-white/5",
                        )}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            <Button
                className="mt-2 w-full"
                size="sm"
                onClick={actions.submit}
                disabled={!state.draft.trim() && state.verdict === "REQUEST_CHANGES"}
            >
                {state.submitted ? <FiCheck /> : <FiGitPullRequest />}
                {state.submitted ? "Submitted to GitHub" : "Submit review"}
            </Button>
        </div>
    );
}

export function VariantA({ state, actions }: VariantProps) {
    return (
        <div className="flex h-full min-h-0 flex-col bg-charcoal text-neutral-100">
            <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/6 px-4">
                <ReviewHeader compact />
                <PreviewControls state={state} actions={actions} />
            </header>
            <div className="grid min-h-0 flex-1 grid-cols-[210px_minmax(420px,1fr)_240px] overflow-auto">
                <aside className="space-y-3 border-r border-white/6 p-3">
                    <div>
                        <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-neutral-600 uppercase">
                            Evidence
                        </p>
                        {evidence.map((item) => (
                            <div
                                key={item.label}
                                className="border-b border-white/5 py-2 last:border-0"
                            >
                                <p className="text-[10px] text-neutral-500">{item.label}</p>
                                <p className="mt-1 text-[11px] leading-relaxed text-neutral-300">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                    <CodeEvidence dense />
                </aside>
                <main className="min-w-0 space-y-3 overflow-y-auto p-3">
                    <div className="grid min-w-[620px] grid-cols-2 gap-3">
                        <PreviewFrame side="Base" state={state} onAnchor={actions.setAnchor} />
                        <PreviewFrame side="Head" state={state} onAnchor={actions.setAnchor} />
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-emerald-400/15 bg-emerald-400/5 px-3 py-2 text-[10px] text-emerald-200">
                        <span className="flex items-center gap-2">
                            <FiShield /> Separate preview origin · synthetic data · no app cookies
                        </span>
                        <span>Ready · expires in 24m</span>
                    </div>
                </main>
                <aside className="space-y-3 border-l border-white/6 p-3">
                    <FeedbackComposer state={state} actions={actions} compact />
                    <VerdictControls state={state} actions={actions} />
                </aside>
            </div>
        </div>
    );
}

export function VariantB({ state, actions }: VariantProps) {
    return (
        <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-[#11110f] text-neutral-100">
            <header className="border-b border-white/7 px-5 py-4">
                <div className="flex items-start justify-between gap-5">
                    <div>
                        <p className="mb-1 text-[10px] font-semibold tracking-[0.18em] text-primary uppercase">
                            Product review studio
                        </p>
                        <ReviewHeader />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/8 px-2.5 py-1 text-[10px] text-emerald-200">
                            Both previews ready
                        </span>
                        <Button variant="secondary" size="sm">
                            <FiExternalLink /> Open PR
                        </Button>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                    <PreviewControls state={state} actions={actions} />
                    <span className="flex items-center gap-2 text-[10px] text-neutral-500">
                        <FiRefreshCw /> refreshed 14s ago
                    </span>
                </div>
            </header>

            <main className="min-h-[360px] flex-1 p-4">
                <div className="grid h-full min-w-[720px] grid-cols-2 gap-4">
                    <PreviewFrame side="Base" state={state} onAnchor={actions.setAnchor} />
                    <PreviewFrame side="Head" state={state} onAnchor={actions.setAnchor} />
                </div>
            </main>

            <section className="grid shrink-0 grid-cols-[1fr_1fr_280px] gap-3 border-t border-white/7 bg-black/20 p-3">
                <div className="grid grid-cols-3 gap-2">
                    {evidence.map((item) => (
                        <div key={item.label} className={cn(PANEL, "p-2.5")}>
                            <p className="text-[9px] tracking-wide text-neutral-600 uppercase">
                                {item.label}
                            </p>
                            <p className="mt-1 text-[10px] leading-relaxed text-neutral-300">
                                {item.value}
                            </p>
                        </div>
                    ))}
                </div>
                <FeedbackComposer state={state} actions={actions} compact />
                <VerdictControls state={state} actions={actions} compact />
            </section>
        </div>
    );
}

export function VariantC({ state, actions }: VariantProps) {
    const steps = [
        { label: "Evidence", done: true },
        { label: "Product diff", done: true },
        { label: "Feedback", done: Boolean(state.draft) },
        { label: "Verdict", done: state.submitted },
    ];

    return (
        <div className="grid h-full min-h-0 grid-cols-[260px_1fr] bg-charcoal text-neutral-100">
            <aside className="flex min-h-0 flex-col border-r border-white/7 bg-black/15">
                <div className="border-b border-white/7 p-4">
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-600 uppercase">
                        Review queue
                    </p>
                    <p className="mt-1 text-sm font-medium">2 waiting</p>
                </div>
                <div className="space-y-1 p-2">
                    <button className="w-full rounded-md border border-primary/25 bg-primary/10 p-2.5 text-left">
                        <p className="text-[10px] text-primary">#482 · READY</p>
                        <p className="mt-1 text-[11px] font-medium text-neutral-100">
                            Add snooze actions
                        </p>
                        <p className="mt-1 text-[10px] text-neutral-500">
                            6 files · agent/snooze-inbox
                        </p>
                    </button>
                    <button className="w-full rounded-md border border-transparent p-2.5 text-left hover:bg-white/4">
                        <p className="text-[10px] text-amber-300">#479 · CODE ONLY</p>
                        <p className="mt-1 text-[11px] font-medium text-neutral-300">
                            Retry failed webhooks
                        </p>
                        <p className="mt-1 text-[10px] text-neutral-600">Preview setup missing</p>
                    </button>
                </div>
                <div className="mt-auto border-t border-white/7 p-3">
                    <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-neutral-600 uppercase">
                        Review path
                    </p>
                    <div className="space-y-2">
                        {steps.map((step, index) => (
                            <div key={step.label} className="flex items-center gap-2 text-[11px]">
                                <span
                                    className={cn(
                                        "flex size-5 items-center justify-center rounded-full border text-[9px]",
                                        step.done
                                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                            : "border-white/10 text-neutral-600",
                                    )}
                                >
                                    {step.done ? <FiCheck /> : index + 1}
                                </span>
                                <span
                                    className={step.done ? "text-neutral-300" : "text-neutral-600"}
                                >
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            <main className="min-w-0 overflow-y-auto">
                <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/7 bg-charcoal/95 px-4 py-3 backdrop-blur">
                    <ReviewHeader compact />
                    <PreviewControls state={state} actions={actions} />
                </header>

                <div className="mx-auto max-w-6xl space-y-4 p-4 pb-24">
                    <section className="grid grid-cols-[1fr_280px] gap-3">
                        <div className={cn(PANEL, "p-3")}>
                            <p className="text-[10px] font-semibold tracking-[0.14em] text-neutral-600 uppercase">
                                What changed
                            </p>
                            <p className="mt-2 text-sm text-neutral-200">
                                Agent added snooze controls and responsive notification-row actions.
                            </p>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                                {evidence.map((item) => (
                                    <div key={item.label} className="rounded-md bg-black/20 p-2">
                                        <p className="text-[9px] text-neutral-600">{item.label}</p>
                                        <p className="mt-1 text-[10px] text-neutral-300">
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={cn(PANEL, "flex flex-col justify-center p-3")}>
                            <span className="flex items-center gap-2 text-[11px] font-medium text-emerald-200">
                                <FiShield /> Preview isolation active
                            </span>
                            <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
                                Separate origin · host-only session · synthetic data · runtime
                                egress blocked
                            </p>
                        </div>
                    </section>

                    <section>
                        <div className="mb-2 flex items-center justify-between">
                            <p className="text-[11px] font-medium text-neutral-300">
                                Step 2 · Compare product behavior
                            </p>
                            <span className="text-[10px] text-neutral-600">
                                Same case, state, and viewport
                            </span>
                        </div>
                        <div className="grid min-w-[680px] grid-cols-2 gap-3">
                            <PreviewFrame
                                side="Base"
                                state={state}
                                onAnchor={actions.setAnchor}
                                compact
                            />
                            <PreviewFrame
                                side="Head"
                                state={state}
                                onAnchor={actions.setAnchor}
                                compact
                            />
                        </div>
                    </section>

                    <section className="grid grid-cols-[1fr_1fr_260px] gap-3">
                        <CodeEvidence />
                        <FeedbackComposer state={state} actions={actions} />
                        <VerdictControls state={state} actions={actions} />
                    </section>
                </div>
            </main>
        </div>
    );
}

function PrototypeSwitcher({
    current,
    onChange,
}: {
    current: VariantKey;
    onChange: (value: VariantKey) => void;
}) {
    const index = VARIANTS.findIndex((variant) => variant.key === current);
    const cycle = useCallback(
        (offset: number) => {
            const next = VARIANTS[(index + offset + VARIANTS.length) % VARIANTS.length];
            onChange(next.key);
        },
        [index, onChange],
    );

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            const target = event.target as HTMLElement | null;
            if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
            if (event.key === "ArrowLeft") cycle(-1);
            if (event.key === "ArrowRight") cycle(1);
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [cycle]);

    if (process.env.NODE_ENV === "production") return null;

    return (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-neutral-950/95 p-1.5 text-neutral-100 shadow-2xl backdrop-blur">
            <button
                aria-label="Previous prototype variant"
                onClick={() => cycle(-1)}
                className="flex size-8 items-center justify-center rounded-full text-neutral-400 hover:bg-white/8 hover:text-white"
            >
                <FiArrowLeft />
            </button>
            <div className="min-w-40 px-3 text-center">
                <p className="text-[9px] font-semibold tracking-[0.14em] text-primary uppercase">
                    Prototype
                </p>
                <p className="text-[11px] font-medium">
                    {VARIANTS[index].key} — {VARIANTS[index].name}
                </p>
            </div>
            <button
                aria-label="Next prototype variant"
                onClick={() => cycle(1)}
                className="flex size-8 items-center justify-center rounded-full text-neutral-400 hover:bg-white/8 hover:text-white"
            >
                <FiArrowRight />
            </button>
        </div>
    );
}

function StateReadout({ state }: { state: PrototypeState }) {
    if (process.env.NODE_ENV === "production") return null;

    return (
        <div className="fixed right-4 bottom-4 z-40 max-w-[45vw] rounded-md border border-white/10 bg-neutral-950/90 px-3 py-2 font-mono text-[9px] text-neutral-500 shadow-xl backdrop-blur">
            inbox-row · {state.previewState.toLowerCase()} · {state.viewport.toLowerCase()} ·
            anchor=
            {state.anchor ? "1" : "0"} · draft={state.draft.length} · {state.verdict.toLowerCase()}{" "}
            · submitted={String(state.submitted)}
        </div>
    );
}

export default function ReviewsDisplay() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const rawVariant = searchParams.get("variant")?.toUpperCase();
    const variant: VariantKey = rawVariant === "B" || rawVariant === "C" ? rawVariant : "A";
    const [state, setState] = useState<PrototypeState>({
        previewState: "Default",
        viewport: "Desktop",
        draft: "The snooze action needs a visible confirmation before this can ship.",
        anchor: "Head · Inbox row · Snooze action",
        verdict: "REQUEST_CHANGES",
        submitted: false,
    });

    const setVariant = useCallback(
        (value: VariantKey) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("variant", value);
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [pathname, router, searchParams],
    );

    const actions = useMemo<PrototypeActions>(
        () => ({
            setPreviewState: (previewState) =>
                setState((current) => ({ ...current, previewState, submitted: false })),
            setViewport: (viewport) => setState((current) => ({ ...current, viewport })),
            setDraft: (draft) => setState((current) => ({ ...current, draft, submitted: false })),
            setAnchor: (anchor) =>
                setState((current) => ({ ...current, anchor, submitted: false })),
            setVerdict: (verdict) =>
                setState((current) => ({ ...current, verdict, submitted: false })),
            submit: () => setState((current) => ({ ...current, submitted: true })),
        }),
        [],
    );

    return (
        <div className="relative h-full min-h-0 w-full overflow-hidden">
            {variant === "A" && <VariantA state={state} actions={actions} />}
            {variant === "B" && <VariantB state={state} actions={actions} />}
            {variant === "C" && <VariantC state={state} actions={actions} />}
            <PrototypeSwitcher current={variant} onChange={setVariant} />
            <StateReadout state={state} />
        </div>
    );
}
