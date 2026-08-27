"use client";
import { GitBranchIcon, GithubLogoIcon, LoadingSpinnerIcon } from "@trymatcha/ui/icons";
import { useMemo, useState } from "react";

import { CapsuleTrigger } from "@/components/playground/Issue/Capsule";
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useConnectGithub } from "@/hooks/github/useConnectGithub";
import { useGithubBranches } from "@/hooks/github/useGithubBranches";
import { useGithubRepos } from "@/hooks/github/useGithubRepos";
import type { GithubRepo, Organization } from "@/types/organization";

import { FIELD } from "./CreateProjectDialog";
import CreateProjectDialogRepoRow from "./CreateProjectDialogRepoRow";

interface Props {
    org: Organization | undefined;
    selectedRepo: GithubRepo | null;
    setSelectedRepo: (repo: GithubRepo | null) => void;
    selectedBranch: string;
    setSelectedBranch: (branch: string) => void;
}

export default function CreateProjectDialogRepository({
    org,
    selectedRepo,
    setSelectedRepo,
    selectedBranch,
    setSelectedBranch,
}: Props) {
    const connect = useConnectGithub();
    const repos = useGithubRepos(org?.id, Boolean(org?.githubConnected));
    const branches = useGithubBranches(org?.id, selectedRepo?.fullName);
    const [repoSearch, setRepoSearch] = useState("");
    const [repoOpen, setRepoOpen] = useState(false);
    const [branchOpen, setBranchOpen] = useState(false);

    const filteredRepos = useMemo(() => {
        const list = repos.data ?? [];
        const q = repoSearch.trim().toLowerCase();
        if (!q) return list;
        return list.filter((r) => r.fullName.toLowerCase().includes(q));
    }, [repos.data, repoSearch]);

    const branchOptions = useMemo(() => {
        const names = branches.data?.map((b) => b.name) ?? [];
        const fallback = selectedRepo?.defaultBranch;
        if (fallback && !names.includes(fallback)) return [fallback, ...names];
        return names.length ? names : fallback ? [fallback] : [];
    }, [branches.data, selectedRepo?.defaultBranch]);

    function selectRepo(repo: GithubRepo) {
        setSelectedRepo(repo);
        setSelectedBranch(repo.defaultBranch);
        setRepoOpen(false);
    }

    if (!org?.githubConnected) {
        return (
            <CapsuleTrigger
                disabled={!org || connect.isPending}
                onClick={() => org && connect.mutate(org.id)}
            >
                <GithubLogoIcon className="size-3.5 text-white/60" aria-hidden />
                Connect GitHub
            </CapsuleTrigger>
        );
    }

    return (
        <>
            <Popover open={repoOpen} onOpenChange={setRepoOpen}>
                <PopoverTrigger asChild>
                    <CapsuleTrigger>
                        <GithubLogoIcon className="size-3.5 text-white/60" aria-hidden />
                        <span className="max-w-52 truncate">
                            {selectedRepo?.fullName ?? "Repository"}
                        </span>
                    </CapsuleTrigger>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-96 p-1.5">
                    <Input
                        value={repoSearch}
                        onChange={(e) => setRepoSearch(e.target.value)}
                        placeholder={repos.isLoading ? "Loading repositories…" : "Search repos…"}
                        className={FIELD}
                    />
                    <div
                        data-lenis-prevent
                        className="no-scrollbar mt-1.5 flex max-h-64 flex-col gap-0.5 overflow-y-auto"
                    >
                        {repos.isLoading ? (
                            <div className="flex items-center gap-2 px-2 py-2 text-xs text-neutral-500">
                                <LoadingSpinnerIcon className="size-3 animate-spin" aria-hidden />
                                Loading…
                            </div>
                        ) : filteredRepos.length === 0 ? (
                            <div className="px-2 py-2 text-xs text-neutral-500">
                                {repos.isError
                                    ? "Couldn't load repositories."
                                    : "No repositories found."}
                            </div>
                        ) : (
                            filteredRepos.map((repo) => (
                                <CreateProjectDialogRepoRow
                                    key={repo.id}
                                    repo={repo}
                                    onImport={selectRepo}
                                />
                            ))
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {selectedRepo && (
                <Popover open={branchOpen} onOpenChange={setBranchOpen} modal>
                    <PopoverTrigger asChild>
                        <CapsuleTrigger>
                            <GitBranchIcon className="size-3.5 text-white/60" aria-hidden />
                            <span className="max-w-40 truncate font-mono">{selectedBranch}</span>
                        </CapsuleTrigger>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64 overflow-hidden p-0">
                        <Command>
                            <CommandInput placeholder="Search branches…" />
                            <CommandList data-lenis-prevent>
                                <CommandEmpty>No branches found.</CommandEmpty>
                                {branchOptions.map((branch) => (
                                    <CommandItem
                                        key={branch}
                                        value={branch}
                                        onSelect={() => {
                                            setSelectedBranch(branch);
                                            setBranchOpen(false);
                                        }}
                                        className="font-mono text-xs"
                                    >
                                        {branch}
                                    </CommandItem>
                                ))}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            )}
        </>
    );
}
