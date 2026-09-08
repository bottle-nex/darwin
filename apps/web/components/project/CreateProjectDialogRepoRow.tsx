"use client";
import { GithubLogoIcon, PrivateRepoIcon } from "@trydarwin/ui/icons";

import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import type { GithubRepo } from "@/types/organization";

interface Props {
    repo: GithubRepo;
    onImport: (repo: GithubRepo) => void;
}

export default function CreateProjectDialogRepoRow({ repo, onImport }: Props) {
    return (
        <div className="group flex shrink-0 items-center gap-2.5 rounded-md px-2 py-2 hover:bg-white/5">
            <GithubLogoIcon className="size-3.5 shrink-0 text-neutral-500" aria-hidden />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="truncate font-mono text-xs text-neutral-300">
                        {repo.fullName}
                    </span>
                    {repo.private && (
                        <PrivateRepoIcon
                            className="size-2.5 shrink-0 text-neutral-500"
                            aria-hidden
                        />
                    )}
                </div>
                {(repo.language || repo.updatedAt) && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-neutral-500">
                        {repo.language && (
                            <span className="flex items-center gap-1">
                                <span
                                    className="size-1.5 rounded-full bg-neutral-500"
                                    aria-hidden
                                />
                                {repo.language}
                            </span>
                        )}
                        {repo.language && repo.updatedAt && (
                            <span className="text-neutral-700">·</span>
                        )}
                        {repo.updatedAt && (
                            <span>Updated {formatRelativeTime(repo.updatedAt)}</span>
                        )}
                    </div>
                )}
            </div>
            <Button
                type="button"
                variant="tertiary"
                size="xs"
                className="shrink-0"
                onClick={() => onImport(repo)}
            >
                Import
            </Button>
        </div>
    );
}
