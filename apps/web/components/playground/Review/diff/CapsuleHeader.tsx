"use client";
import type { Capsule } from "@trymatcha/types";

const CHANGE_LABEL: Partial<Record<Capsule["change"], string>> = {
    Added: "new",
    Removed: "removed",
};

function short(sha: string): string {
    return sha.slice(0, 7);
}

export default function CapsuleHeader({
    capsule,
    total,
    baseSha,
    headSha,
}: {
    capsule: Capsule;
    total: number;
    baseSha: string;
    headSha: string;
}) {
    const change = CHANGE_LABEL[capsule.change];

    return (
        <header className="flex shrink-0 items-center gap-2.5 pb-3">
            <h2 className="shrink-0 text-[12.5px] font-medium text-neutral-400">UI Previews</h2>
            <span className="h-3 w-px shrink-0 bg-white/10" aria-hidden />
            <span className="shrink-0 text-[13px] font-medium text-neutral-200">
                {capsule.title}
            </span>
            {change && (
                <span className="shrink-0 rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
                    {change}
                </span>
            )}
            <span className="min-w-0 flex-1 truncate text-[12px] text-neutral-500">
                {capsule.componentPath}
            </span>
            <span className="shrink-0 text-[11.5px] text-neutral-500 tabular-nums">
                {total} {total === 1 ? "component" : "components"}
                <span className="px-1.5 text-neutral-700">·</span>
                {short(baseSha)} → {short(headSha)}
            </span>
        </header>
    );
}
