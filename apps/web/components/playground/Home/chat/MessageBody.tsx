"use client";

import {
    parse_reference_token,
    reference_key,
    reference_labels,
    reference_split_pattern,
    type LabelledReference,
} from "@trymatcha/types";
import { cn } from "@/lib/utils";
import { useIssueDialog } from "@/components/playground/issue/useIssueDialog";

const TOMBSTONE_LABEL = { member: "@unknown", issue: "#deleted issue" } as const;

export default function MessageBody({
    text,
    references,
    isMine,
}: {
    text: string;
    references: LabelledReference[];
    isMine: boolean;
}) {
    const { openEdit } = useIssueDialog();
    const labels = reference_labels(references);

    return (
        <>
            {text.split(reference_split_pattern()).map((part, index) => {
                if (index % 2 === 0) return part;

                const token = parse_reference_token(part);
                if (!token) return part;

                const label = labels.get(reference_key(token.kind, token.id));
                if (!label) {
                    return (
                        <span
                            key={index}
                            className={cn(
                                "mx-px rounded-[3px] px-1 italic",
                                isMine ? "text-white/60" : "text-neutral-500",
                            )}
                        >
                            {TOMBSTONE_LABEL[token.kind]}
                        </span>
                    );
                }

                if (token.kind === "member") {
                    return (
                        <span key={index} className="mx-px px-1 font-semibold text-white">
                            {label}
                        </span>
                    );
                }

                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => openEdit(token.id)}
                        className={cn(
                            "mx-px cursor-pointer rounded-[3px] px-1 font-medium underline-offset-2 transition-colors hover:underline",
                            isMine ? "bg-black/20 text-white" : "bg-white/10 text-neutral-100",
                        )}
                    >
                        {label}
                    </button>
                );
            })}
        </>
    );
}
