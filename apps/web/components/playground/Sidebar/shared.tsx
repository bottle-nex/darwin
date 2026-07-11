"use client";

import { type IconType } from "react-icons";
import { MdAdd } from "react-icons/md";
import PlaygroundAvatar, {
    type AvatarTone,
} from "@/components/playground/Core/components/PlaygroundAvatar";

// ── Shared row-leading helpers ──────────────────────────────────────────────
// A row leads with either an icon or a letter avatar. Sections declare
// the intent with `LeadingSpec`; `rowLeading` turns that into the concrete
// prop a row expects (it needs a ready-made node for avatars).

export type LeadingSpec =
    | { kind: "icon"; icon: IconType }
    | { kind: "avatar"; letter: string; tone: AvatarTone };

export function rowLeading(spec: LeadingSpec) {
    return spec.kind === "icon"
        ? ({ kind: "icon", icon: spec.icon } as const)
        : ({
              kind: "node",
              node: <PlaygroundAvatar letter={spec.letter} tone={spec.tone} size="sm" />,
          } as const);
}

/** A navigable row, surfaced for keyboard search navigation. */
export type SidebarNavRow = { id: string; label: string };

/** Props threaded into every section by the sidebar shell. */
export type SidebarSectionProps = {
    selectedRowId: string;
    onSelect: (id: string) => void;
    /** Active search query; empty string when search is closed/idle. */
    query: string;
};

/** Case-insensitive substring match used to filter rows by their label. */
export function matchesQuery(label: string, query: string) {
    return label.toLowerCase().includes(query.trim().toLowerCase());
}

/** Trailing hover action chip (e.g. the ellipsis / plus beside an agent). */
export function PlaygroundSidebarRowAction({ children }: { children: React.ReactNode }) {
    return (
        <span className="flex size-5 cursor-pointer items-center justify-center rounded text-neutral-400 hover:bg-white/10 hover:text-neutral-100">
            {children}
        </span>
    );
}

/** Right-aligned "+" affordance rendered in a section header. */
export function PlaygroundSidebarSectionAddButton({ label }: { label: string }) {
    return (
        <button
            type="button"
            aria-label={label}
            className="flex size-5 cursor-pointer items-center justify-center rounded text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
        >
            <MdAdd className="size-3.5" aria-hidden />
        </button>
    );
}
