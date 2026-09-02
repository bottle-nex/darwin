"use client";
import { CheckIcon, CommitsIcon, FilterIcon } from "@trymatcha/ui/icons";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import IconWrapper from "@/components/ui/IconWrapper";
import { useReviewCommits } from "@/hooks/review/useReviewCommits";
import { shortSha } from "@/lib/review/commit";

export default function CommitFilterMenu({
    projectId,
    pullNumber,
    commit,
    onSelect,
}: {
    projectId: string | undefined;
    pullNumber: number;
    commit: string | undefined;
    onSelect: (sha: string | undefined) => void;
}) {
    const { data: commits } = useReviewCommits(projectId, pullNumber);
    if (!commits?.length) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label="Filter by commit"
                    className="group cursor-pointer"
                >
                    <IconWrapper
                        icon={FilterIcon}
                        variant="ring"
                        active={Boolean(commit)}
                        title="Filter by commit"
                    />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-88 w-72 overflow-y-auto">
                <DropdownMenuLabel>Filter by commit</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => onSelect(undefined)}>
                    <CommitsIcon className="size-3.5 text-neutral-400" aria-hidden />
                    <span className="flex-1">All commits</span>
                    {!commit && <CheckIcon className="size-3.5 text-neutral-200" aria-hidden />}
                </DropdownMenuItem>
                {commits.map((entry) => (
                    <DropdownMenuItem key={entry.sha} onSelect={() => onSelect(entry.sha)}>
                        <span className="shrink-0 font-mono text-[11px] text-neutral-500">
                            {shortSha(entry.sha)}
                        </span>
                        <span className="flex-1 truncate">{entry.subject}</span>
                        {commit === entry.sha && (
                            <CheckIcon className="size-3.5 shrink-0 text-neutral-200" aria-hidden />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
