import { cn } from "@/lib/utils";
import type { BoardAssignee } from "@/types/board";

const MAX_SHOWN = 3;

// A small, fixed palette; the tone is picked deterministically from the user id
// so a given person always reads the same colour across cards.
const TONES = [
    "bg-indigo-500/30 text-indigo-100",
    "bg-emerald-500/30 text-emerald-100",
    "bg-sky-500/30 text-sky-100",
    "bg-rose-500/30 text-rose-100",
    "bg-amber-500/30 text-amber-100",
    "bg-violet-500/30 text-violet-100",
];

export function toneFor(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return TONES[hash % TONES.length];
}

/**
 * Overlapping initial-avatars for an issue's assignees. Shows up to three, then a
 * "+N" overflow chip. Initials only (no images) so it never depends on a remote
 * avatar host being whitelisted for next/image.
 */
export default function CardAvatars({ assignees }: { assignees: BoardAssignee[] }) {
    if (assignees.length === 0) return null;

    const shown = assignees.slice(0, MAX_SHOWN);
    const overflow = assignees.length - shown.length;

    return (
        <div className="flex items-center -space-x-1.5">
            {shown.map((a) => (
                <span
                    key={a.id}
                    title={a.name ?? undefined}
                    className={cn(
                        "flex size-5 items-center justify-center rounded-full text-[9px] font-semibold ring-1 ring-charcoal",
                        toneFor(a.id),
                    )}
                >
                    {(a.name?.trim()?.[0] ?? "?").toUpperCase()}
                </span>
            ))}
            {overflow > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-white/10 text-[9px] font-medium text-neutral-300 ring-1 ring-charcoal">
                    +{overflow}
                </span>
            )}
        </div>
    );
}
