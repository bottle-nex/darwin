"use client";

import { type IconType } from "react-icons";
import { HiOutlinePlus } from "react-icons/hi2";

import PlaygroundAvatar, {
    type AvatarTone,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { Button } from "@/components/ui/button";

// ── Shared row-leading helpers ──────────────────────────────────────────────
// A row leads with either an icon or a letter avatar. Sections declare
// the intent with `LeadingSpec`; `rowLeading` turns that into the concrete
// prop a row expects (it needs a ready-made node for avatars).

export type LeadingSpec =
    { kind: "icon"; icon: IconType } | { kind: "avatar"; letter: string; tone: AvatarTone };

export function rowLeading(spec: LeadingSpec) {
    return spec.kind === "icon"
        ? ({ kind: "icon", icon: spec.icon } as const)
        : ({
              kind: "node",
              node: <PlaygroundAvatar letter={spec.letter} tone={spec.tone} size="sm" />,
          } as const);
}

/** Props threaded into every section by the sidebar. */
export type SidebarSectionProps = {
    selectedRowId: string;
    onSelect: (id: string) => void;
};

export const SIDEBAR_ICON_BUTTON_CLASS =
    "relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100 disabled:cursor-default disabled:opacity-40";

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
        <Button
            variant="unstyled"
            type="button"
            aria-label={label}
            className="flex size-5 cursor-pointer items-center justify-center rounded text-neutral-400 hover:bg-white/5 hover:text-neutral-100 ring-inset focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden"
        >
            <HiOutlinePlus className="size-3.5" aria-hidden />
        </Button>
    );
}
