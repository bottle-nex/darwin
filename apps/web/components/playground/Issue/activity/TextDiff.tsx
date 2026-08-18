"use client";
import { cn } from "@/lib/utils";

type DiffPart = { kind: "same" | "added" | "removed"; text: string };

/**
 * Words only. Runs of whitespace collapse to a single space, which keeps a
 * word comparable wherever it sits — a line's last word has no trailing space,
 * so tokens that carried their own spacing would never match mid-line.
 */
function tokenize(text: string): string[] {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/) : [];
}

/**
 * Word-level LCS. Title and summary are both capped at 255 characters upstream,
 * so the quadratic table stays far too small for anything smarter to pay off.
 */
function diff_words(before: string, after: string): DiffPart[] {
    const a = tokenize(before);
    const b = tokenize(after);

    const lcs: number[][] = Array.from({ length: a.length + 1 }, () =>
        new Array<number>(b.length + 1).fill(0),
    );
    for (let i = a.length - 1; i >= 0; i--) {
        for (let j = b.length - 1; j >= 0; j--) {
            lcs[i][j] =
                a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
        }
    }

    const parts: DiffPart[] = [];
    function push(kind: DiffPart["kind"], word: string) {
        const last = parts[parts.length - 1];
        if (last && last.kind === kind) last.text += ` ${word}`;
        else parts.push({ kind, text: word });
    }

    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
        if (a[i] === b[j]) {
            push("same", a[i]);
            i++;
            j++;
        } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
            push("removed", a[i++]);
        } else {
            push("added", b[j++]);
        }
    }
    while (i < a.length) push("removed", a[i++]);
    while (j < b.length) push("added", b[j++]);
    return parts;
}

const TONE = {
    removed: {
        row: "bg-rose-500/6",
        marker: "text-rose-400/70",
        word: "bg-rose-500/20 text-rose-200",
    },
    added: {
        row: "bg-emerald-500/6",
        marker: "text-emerald-400/70",
        word: "bg-emerald-500/20 text-emerald-200",
    },
};

/** One side of the diff: the words it shares with the other, plus its own. */
function DiffLine({ side, parts }: { side: "removed" | "added"; parts: DiffPart[] }) {
    const tone = TONE[side];
    const opposite = side === "removed" ? "added" : "removed";
    const shown = parts.filter((part) => part.kind !== opposite);

    return (
        <div className={cn("flex gap-x-2 rounded-[4px] px-2 py-1", tone.row)}>
            <span aria-hidden className={cn("shrink-0 select-none", tone.marker)}>
                {side === "removed" ? "−" : "+"}
            </span>
            <span className="min-w-0 wrap-anywhere">
                {shown.length === 0 ? (
                    <span className="text-neutral-600 italic">empty</span>
                ) : (
                    shown.map((part, index) => (
                        <span key={index}>
                            {/* The separator sits outside the highlight so it hugs the words. */}
                            {index > 0 && " "}
                            <span
                                className={
                                    part.kind === "same"
                                        ? "text-neutral-500"
                                        : cn("rounded-[2px] px-0.5", tone.word)
                                }
                            >
                                {part.text}
                            </span>
                        </span>
                    ))
                )}
            </span>
        </div>
    );
}

/** A two-line git-style diff for the short text fields the feed records. */
export default function TextDiff({
    before,
    after,
}: {
    before?: string | null;
    after?: string | null;
}) {
    const parts = diff_words(before ?? "", after ?? "");
    return (
        <div className="flex w-[min(26rem,68vw)] flex-col gap-y-0.5 font-mono text-[12px] leading-[18px]">
            <DiffLine side="removed" parts={parts} />
            <DiffLine side="added" parts={parts} />
        </div>
    );
}
