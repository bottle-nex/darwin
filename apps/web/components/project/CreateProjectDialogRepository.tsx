"use client";
import { useMemo, useState } from "react";
import { FaGithub, FaSpinner, FaLock, FaCodeBranch } from "react-icons/fa6";
import { MdKeyboardArrowDown } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useGithubRepos } from "@/hooks/github/useGithubRepos";
import { useGithubBranches } from "@/hooks/github/useGithubBranches";
import { useConnectGithub } from "@/hooks/github/useConnectGithub";
import type { GithubRepo, Organization } from "@/types/organization";
import { FIELD, SURFACE } from "./CreateProjectDialog";
import CreateProjectDialogRepoRow from "./CreateProjectDialogRepoRow";

type RepoState = "connect" | "selected" | "list";

interface Props {
    org: Organization | undefined;
    detailsReady: boolean;
    selectedRepo: GithubRepo | null;
    setSelectedRepo: (repo: GithubRepo | null) => void;
    selectedBranch: string;
    setSelectedBranch: (branch: string) => void;
}

export default function CreateProjectDialogRepository({
    org,
    detailsReady,
    selectedRepo,
    setSelectedRepo,
    selectedBranch,
    setSelectedBranch,
}: Props) {
    const connect = useConnectGithub();
    const repos = useGithubRepos(org?.id, Boolean(org?.githubConnected));
    const branches = useGithubBranches(org?.id, selectedRepo?.fullName);
    const [repoSearch, setRepoSearch] = useState("");
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

    const repoState: RepoState = !org?.githubConnected
        ? "connect"
        : selectedRepo
          ? "selected"
          : "list";

    function selectRepo(repo: GithubRepo) {
        setSelectedRepo(repo);
        setSelectedBranch(repo.defaultBranch);
    }

    function clearRepo() {
        setSelectedRepo(null);
        setSelectedBranch("");
    }

    function renderConnect() {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/5 shadow-[inset_0_1px_0_0_var(--color-edge)]">
                    <FaGithub className="size-4 text-neutral-500" aria-hidden />
                </span>
                <p className="max-w-60 text-xs text-neutral-500">
                    Connect GitHub to attach a repository to this project.
                </p>
                <Button
                    type="button"
                    variant="tertiary"
                    size="sm"
                    loading={connect.isPending}
                    disabled={!org || connect.isPending}
                    onClick={() => org && connect.mutate(org.id)}
                >
                    {!connect.isPending && <FaGithub className="size-3.5" aria-hidden />}
                    Connect GitHub
                </Button>
            </div>
        );
    }

    function renderSelected() {
        if (!selectedRepo) return null;
        return (
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-matcha/40 bg-matcha/5 px-3 py-2.5">
                    <FaGithub className="size-3.5 shrink-0 text-neutral-300" aria-hidden />
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-neutral-200">
                        {selectedRepo.fullName}
                    </span>
                    {selectedRepo.private && (
                        <FaLock className="size-3 shrink-0 text-neutral-500" aria-hidden />
                    )}
                </div>

                <div>
                    <Label className="text-xs text-neutral-400">Branch</Label>
                    <Popover open={branchOpen} onOpenChange={setBranchOpen} modal>
                        <PopoverTrigger asChild>
                            <Button
                                variant="unstyled"
                                type="button"
                                className="mt-1.5 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg bg-[#171717] px-3 py-2 font-mono text-xs text-neutral-200 shadow-[inset_0_2px_0_0_var(--color-edge)] hover:bg-[#1c1c1c]"
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <FaCodeBranch
                                        className="size-3 shrink-0 text-neutral-500"
                                        aria-hidden
                                    />
                                    <span className="truncate">{selectedBranch}</span>
                                </span>
                                <MdKeyboardArrowDown
                                    className="size-4 shrink-0 text-neutral-500"
                                    aria-hidden
                                />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="start"
                            className="w-(--radix-popover-trigger-width) overflow-hidden p-0"
                        >
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
                    <p className="mt-1.5 text-[11px] text-neutral-500">
                        The agent clones this branch to learn your project.
                    </p>
                </div>
            </div>
        );
    }

    function renderList() {
        return (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
                <Input
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    disabled={!detailsReady}
                    placeholder={repos.isLoading ? "Loading repositories…" : "Search repos…"}
                    className={FIELD}
                />
                <div
                    data-lenis-prevent
                    className={cn(
                        "flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-1.5",
                        SURFACE,
                    )}
                >
                    {repos.isLoading ? (
                        <div className="flex items-center gap-2 px-2 py-2 text-xs text-neutral-500">
                            <FaSpinner className="size-3 animate-spin" aria-hidden />
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
            </div>
        );
    }

    function renderBody() {
        switch (repoState) {
            case "connect":
                return renderConnect();
            case "selected":
                return renderSelected();
            case "list":
                return renderList();
        }
    }

    return (
        <div className="flex flex-[2] flex-col px-5 py-5">
            <div className="mb-2 flex items-center justify-between">
                <Label className="text-neutral-300">
                    Repository
                    <span className="ml-1 text-neutral-600">(optional)</span>
                </Label>
                {detailsReady && repoState === "selected" && (
                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={clearRepo}
                        className="cursor-pointer text-[11px] text-neutral-500 hover:text-neutral-300"
                    >
                        Change
                    </Button>
                )}
            </div>

            <div
                aria-disabled={!detailsReady}
                className={cn(
                    "flex min-h-0 flex-1 flex-col",
                    !detailsReady && "pointer-events-none opacity-40 select-none",
                )}
            >
                {renderBody()}
            </div>
        </div>
    );
}
