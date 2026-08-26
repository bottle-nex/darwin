"use client";
import type { Capsule } from "@trymatcha/types";

import { MICRO_LABEL } from "@/components/playground/Core/components/paneBar";
import { cn } from "@/lib/utils";

const CHANGE_LABEL: Record<Capsule["change"], string> = {
    Modified: "changed",
    Added: "new",
    Removed: "removed",
};

export default function CapsuleList({
    capsules,
    selectedId,
    onSelect,
}: {
    capsules: Capsule[];
    selectedId: string;
    onSelect: (id: string) => void;
}) {
    return (
        <nav className="flex flex-col gap-1">
            <span className={MICRO_LABEL}>Components</span>
            <ul className="flex flex-col gap-0.5">
                {capsules.map((capsule) => (
                    <li key={capsule.id}>
                        <button
                            type="button"
                            onClick={() => onSelect(capsule.id)}
                            className={cn(
                                "flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors",
                                capsule.id === selectedId
                                    ? "bg-white/6 text-neutral-100"
                                    : "text-neutral-400 hover:bg-white/3 hover:text-neutral-200",
                            )}
                        >
                            <span className="flex w-full items-center justify-between gap-2">
                                <span className="truncate text-[13px] font-medium">
                                    {capsule.title}
                                </span>
                                <span className="shrink-0 text-[10px] text-neutral-500">
                                    {CHANGE_LABEL[capsule.change]}
                                </span>
                            </span>
                            <span className="w-full truncate text-[11px] text-neutral-500">
                                {capsule.componentPath}
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
