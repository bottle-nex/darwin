"use client";
import { cn } from "@/lib/utils";
import type { Organization, OrgRole } from "@/types/organization";
import PlaygroundAvatar, {
    type AvatarTone,
} from "@/components/playground/Core/components/PlaygroundAvatar";

const ROLE_DOT: Record<OrgRole, string> = {
    Owner: "bg-emerald-400 shadow-[0_0_6px_0] shadow-emerald-400/60",
    Admin: "bg-amber-400 shadow-[0_0_6px_0] shadow-amber-400/60",
    Member: "bg-neutral-400 shadow-[0_0_6px_0] shadow-neutral-400/50",
    Billing: "bg-sky-400 shadow-[0_0_6px_0] shadow-sky-400/60",
};

const TONES: AvatarTone[] = ["indigo", "purple", "blue", "emerald"];

/** Deterministic avatar tone so an org keeps the same color across renders. */
function toneFor(slug: string): AvatarTone {
    let sum = 0;
    for (const ch of slug) sum += ch.charCodeAt(0);
    return TONES[sum % TONES.length];
}

export default function OrgListItem({
    org,
    selected,
    onSelect,
}: {
    org: Organization;
    selected: boolean;
    onSelect: () => void;
}) {
    const { name, slug, role } = org;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer",
                selected ? "bg-white/8" : "hover:bg-white/5",
            )}
        >
            <PlaygroundAvatar
                letter={name.trim().charAt(0).toUpperCase() || "?"}
                tone={toneFor(slug)}
                size="md"
            />
            <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-neutral-100">{name}</p>
                <p className="truncate font-mono text-[11px] tracking-tight text-neutral-500">
                    @{slug}
                </p>
            </div>
            <span
                className={cn("size-1.5 shrink-0 rounded-full", ROLE_DOT[role])}
                aria-hidden
                title={role}
            />
        </button>
    );
}
