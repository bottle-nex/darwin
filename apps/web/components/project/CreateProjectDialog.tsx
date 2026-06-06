"use client";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { isAxiosError } from "axios";
import { useParams } from "next/navigation";
import { FaGithub, FaSpinner, FaLock } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { slugify, formatRelativeTime } from "@/lib/format";
import { useNewProjectStore } from "@/store/project/useNewProjectStore";
import { useFetchOrganizations } from "@/hooks/playground/useFetchOrganizations";
import { useGithubRepos } from "@/hooks/github/useGithubRepos";
import { useConnectGithub } from "@/hooks/github/useConnectGithub";
import { useCreateProject } from "@/hooks/project/useCreateProject";
import type { GithubRepo } from "@/types/organization";

const FORM_ID = "create-project-form";

const FIELD =
    "mt-1.5 border-white/10 bg-white/5 text-neutral-200 placeholder:text-neutral-500 focus-visible:border-[#9bc24f] focus-visible:ring-[#9bc24f]/30";

const SURFACE = "rounded-lg bg-white/5 shadow-[inset_0_1px_0_0_#262626]";

type FormValues = {
    name: string;
    slug: string;
    description: string;
};

export default function CreateProjectDialog() {
    const { open, setOpen, targetOrgSlug, setTargetOrgSlug } = useNewProjectStore();
    const { orgSlug: orgSlugParam } = useParams<{ orgSlug: string }>();
    const { data: organizations } = useFetchOrganizations();

    // Off-route (e.g. the playground landing) the target org comes from the
    // store; inside a workspace it falls back to the route param.
    const orgSlug = targetOrgSlug ?? (typeof orgSlugParam === "string" ? orgSlugParam : "");
    const org = (organizations ?? []).find((o) => o.slug === orgSlug);

    const repos = useGithubRepos(org?.id, Boolean(org?.githubConnected));
    const connect = useConnectGithub();
    const createProject = useCreateProject();

    const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
    const [repoSearch, setRepoSearch] = useState("");

    const {
        register,
        handleSubmit,
        setValue,
        control,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: { name: "", slug: "", description: "" },
    });

    const [slugEdited, setSlugEdited] = useState(false);
    const name = useWatch({ control, name: "name" });
    const description = useWatch({ control, name: "description" });

    const detailsReady = Boolean(name?.trim());

    const nameField = register("name", {
        required: "Name is required",
        validate: (value) => value.trim().length > 0 || "Name is required",
    });
    const slugField = register("slug");

    const filteredRepos = useMemo(() => {
        const list = repos.data ?? [];
        const q = repoSearch.trim().toLowerCase();
        if (!q) return list;
        return list.filter((r) => r.fullName.toLowerCase().includes(q));
    }, [repos.data, repoSearch]);

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (!next) {
            reset();
            setSlugEdited(false);
            setSelectedRepo(null);
            setRepoSearch("");
            setTargetOrgSlug(null);
            createProject.reset();
        }
    }

    const onSubmit = handleSubmit((values) => {
        if (!org) return;
        const trimmed = values.name.trim();
        const projectSlug = values.slug.trim() || slugify(trimmed);
        const desc = values.description.trim();

        createProject.mutate(
            {
                org_id: org.id,
                name: trimmed,
                slug: projectSlug,
                description: desc || undefined,
                repo: selectedRepo
                    ? {
                          githubRepoId: selectedRepo.id,
                          fullName: selectedRepo.fullName,
                          htmlUrl: selectedRepo.htmlUrl,
                          defaultBranch: selectedRepo.defaultBranch,
                      }
                    : undefined,
            },
            {
                onSuccess: () => handleOpenChange(false),
            },
        );
    });

    const slugTaken =
        isAxiosError(createProject.error) &&
        createProject.error.response?.data?.error?.code === "SLUG_TAKEN";

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="gap-0 overflow-hidden border-white/10 bg-charcoal p-0 sm:max-w-3xl"
            >
                <div className="flex items-start justify-between gap-4 px-5 py-4">
                    <DialogHeader className="gap-1">
                        <DialogTitle className="text-base text-neutral-100">
                            Create project
                        </DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500">
                            Projects hold the repos your runners clone and the issues your agents
                            pick up.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            type="button"
                            variant="tertiary"
                            size="sm"
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form={FORM_ID}
                            size="sm"
                            loading={createProject.isPending}
                            disabled={!detailsReady || !org || createProject.isPending}
                        >
                            Create Project
                        </Button>
                    </div>
                </div>

                <div className="flex h-96">
                    <form
                        id={FORM_ID}
                        onSubmit={onSubmit}
                        className="flex flex-1 flex-col gap-4 px-5 py-5"
                    >
                        <div>
                            <Label htmlFor="project-name" className="text-neutral-300">
                                Name
                            </Label>
                            <Input
                                id="project-name"
                                {...nameField}
                                onChange={(e) => {
                                    nameField.onChange(e);
                                    if (!slugEdited) setValue("slug", slugify(e.target.value));
                                }}
                                placeholder="Billing Service"
                                autoFocus
                                className={FIELD}
                            />
                            {errors.name && (
                                <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="project-slug" className="text-neutral-300">
                                Slug
                            </Label>
                            <div className="relative">
                                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm text-neutral-600">
                                    @
                                </span>
                                <Input
                                    id="project-slug"
                                    {...slugField}
                                    onChange={(e) => {
                                        setSlugEdited(true);
                                        setValue("slug", slugify(e.target.value));
                                    }}
                                    placeholder="billing-service"
                                    className={`${FIELD} pl-7 font-mono`}
                                />
                            </div>
                            {slugTaken && (
                                <p className="mt-1.5 text-xs text-red-400">
                                    That slug is already taken.
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="project-description" className="text-neutral-300">
                                Description
                                <span className="ml-1 text-neutral-600">(optional)</span>
                            </Label>
                            <textarea
                                id="project-description"
                                {...register("description")}
                                maxLength={150}
                                placeholder="What does this project do?"
                                rows={4}
                                className={cn(
                                    "mt-1.5 w-full resize-none px-3 py-2 text-sm text-neutral-200 outline-none placeholder:text-neutral-500 focus-visible:ring-[3px] focus-visible:ring-[#9bc24f]/30",
                                    SURFACE,
                                )}
                            />
                            <p className="mt-1 text-right text-xs text-neutral-500">
                                {description?.length ?? 0}/150
                            </p>
                        </div>
                    </form>

                    <div className="my-5 w-px shrink-0 bg-white/10" />

                    <div className="flex flex-1 flex-col px-5 py-5">
                        <div className="mb-2 flex items-center justify-between">
                            <Label className="text-neutral-300">
                                Repository
                                <span className="ml-1 text-neutral-600">(optional)</span>
                            </Label>
                            {detailsReady && org?.githubConnected && selectedRepo && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedRepo(null)}
                                    className="text-[11px] text-neutral-500 hover:text-neutral-300 cursor-pointer"
                                >
                                    Change
                                </button>
                            )}
                        </div>

                        <div
                            aria-disabled={!detailsReady}
                            className={cn(
                                "flex min-h-0 flex-1 flex-col",
                                !detailsReady && "pointer-events-none opacity-40 select-none",
                            )}
                        >
                            {!org?.githubConnected ? (
                                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-white/5 shadow-[inset_0_1px_0_0_#262626]">
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
                                        {!connect.isPending && (
                                            <FaGithub className="size-3.5" aria-hidden />
                                        )}
                                        Connect GitHub
                                    </Button>
                                </div>
                            ) : selectedRepo ? (
                                <div
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2.5",
                                        "rounded-lg border border-[#9bc24f]/40 bg-[#9bc24f]/5",
                                    )}
                                >
                                    <FaGithub
                                        className="size-3.5 shrink-0 text-neutral-300"
                                        aria-hidden
                                    />
                                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-neutral-200">
                                        {selectedRepo.fullName}
                                    </span>
                                    {selectedRepo.private && (
                                        <FaLock
                                            className="size-3 shrink-0 text-neutral-500"
                                            aria-hidden
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="flex min-h-0 flex-1 flex-col gap-2">
                                    <Input
                                        value={repoSearch}
                                        onChange={(e) => setRepoSearch(e.target.value)}
                                        disabled={!detailsReady}
                                        placeholder={
                                            repos.isLoading
                                                ? "Loading repositories…"
                                                : "Search repos…"
                                        }
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
                                                <FaSpinner
                                                    className="size-3 animate-spin"
                                                    aria-hidden
                                                />
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
                                                <div
                                                    key={repo.id}
                                                    className="group flex shrink-0 items-center gap-2.5 rounded-md px-2 py-2 hover:bg-white/5"
                                                >
                                                    <FaGithub
                                                        className="size-3.5 shrink-0 text-neutral-500"
                                                        aria-hidden
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="truncate font-mono text-xs text-neutral-300">
                                                                {repo.fullName}
                                                            </span>
                                                            {repo.private && (
                                                                <FaLock
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
                                                                {repo.language &&
                                                                    repo.updatedAt && (
                                                                        <span className="text-neutral-700">
                                                                            ·
                                                                        </span>
                                                                    )}
                                                                {repo.updatedAt && (
                                                                    <span>
                                                                        Updated{" "}
                                                                        {formatRelativeTime(
                                                                            repo.updatedAt,
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="tertiary"
                                                        size="xs"
                                                        className="shrink-0"
                                                        onClick={() => setSelectedRepo(repo)}
                                                    >
                                                        Import
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
