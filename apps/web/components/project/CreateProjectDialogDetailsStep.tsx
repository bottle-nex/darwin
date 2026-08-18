"use client";
import { useState } from "react";
import { isAxiosError } from "axios";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { PiSmileyFill } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import IconPicker, { IconPickGlyph, type IconPick } from "@/components/ui/IconPicker";
import { DIALOG_TITLE_FIELD, GHOST_FIELD } from "@/components/ui/fieldStyles";
import { CapsuleTrigger } from "@/components/playground/Issue/Capsule";
import IssueDescriptionEditor from "@/components/playground/Issue/editor/IssueDescriptionEditor";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/format";
import { useCreateProject } from "@/hooks/project/useCreateProject";
import type { GithubRepo, Organization } from "@/types/organization";
import { FIELD } from "./CreateProjectDialog";
import CreateProjectDialogRepository from "./CreateProjectDialogRepository";

interface Props {
    org: Organization | undefined;
    mustCreateProject: boolean;
    onCancel: () => void;
    onCreated: (projectId: string) => void;
}

export default function CreateProjectDialogDetailsStep({
    org,
    mustCreateProject,
    onCancel,
    onCreated,
}: Props) {
    const createProject = useCreateProject();

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [slugEdited, setSlugEdited] = useState(false);
    const [slugOpen, setSlugOpen] = useState(false);
    const [description, setDescription] = useState("");
    const [descriptionEmpty, setDescriptionEmpty] = useState(true);
    const [icon, setIcon] = useState<IconPick | null>(null);
    const [iconOpen, setIconOpen] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
    const [selectedBranch, setSelectedBranch] = useState("");

    const ready = Boolean(name.trim()) && Boolean(org) && !createProject.isPending;
    const slugTaken =
        isAxiosError(createProject.error) &&
        createProject.error.response?.data?.error?.code === "SLUG_TAKEN";

    function submit() {
        if (!ready || !org) return;
        const trimmed = name.trim();

        createProject.mutate(
            {
                org_id: org.id,
                name: trimmed,
                slug: slug.trim() || slugify(trimmed),
                description: descriptionEmpty ? undefined : description,
                repo: selectedRepo
                    ? {
                          githubRepoId: selectedRepo.id,
                          fullName: selectedRepo.fullName,
                          htmlUrl: selectedRepo.htmlUrl,
                          defaultBranch: selectedBranch || selectedRepo.defaultBranch,
                      }
                    : undefined,
            },
            { onSuccess: (project) => onCreated(project.id) },
        );
    }

    return (
        <main className="flex min-h-0 min-w-0 flex-1 flex-col justify-between *:px-6">
            <section className="flex flex-col items-start gap-y-3 pt-4 pb-2">
                <div className="flex w-full items-center justify-between">
                    <div className="flex items-center justify-start gap-x-1 text-snow text-xs">
                        <PlaygroundAvatar
                            letter={org?.name.slice(0, 2) ?? ""}
                            tone="emerald"
                            className="uppercase"
                        />
                        <span>
                            <MdOutlineKeyboardArrowRight />
                        </span>
                        <span className="text-sm">New Project</span>
                    </div>
                    <IconPicker open={iconOpen} onOpenChange={setIconOpen} onSelect={setIcon}>
                        <CapsuleTrigger
                            aria-label="Pick project icon"
                            className="size-7 shrink-0 justify-center rounded-full p-0"
                        >
                            {icon ? (
                                <IconPickGlyph pick={icon} className="size-3.5 text-sm" />
                            ) : (
                                <PiSmileyFill className="size-3.5 text-white/60" aria-hidden />
                            )}
                        </CapsuleTrigger>
                    </IconPicker>
                </div>
                <Textarea
                    rows={1}
                    autoFocus
                    placeholder="Project name"
                    maxLength={80}
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (!slugEdited) setSlug(slugify(e.target.value));
                    }}
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                    className={cn(GHOST_FIELD, DIALOG_TITLE_FIELD)}
                />
            </section>

            <section
                data-lenis-prevent
                className="no-scrollbar flex-1 min-h-0 overflow-y-auto pb-4"
            >
                <IssueDescriptionEditor
                    placeholder="What does this project do?"
                    onChange={(state) => {
                        setDescription(state.html);
                        setDescriptionEmpty(state.isEmpty);
                    }}
                />
            </section>

            <section className="flex flex-col gap-y-4 pb-4">
                <div className="flex items-center gap-x-2.5">
                    <Popover open={slugOpen} onOpenChange={setSlugOpen}>
                        <PopoverTrigger asChild>
                            <CapsuleTrigger>
                                <span className="font-mono text-white/40">@</span>
                                <span className="max-w-40 truncate font-mono">
                                    {slug || "slug"}
                                </span>
                            </CapsuleTrigger>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-64 p-1.5">
                            <Input
                                autoFocus
                                value={slug}
                                onChange={(e) => {
                                    setSlugEdited(true);
                                    setSlug(slugify(e.target.value));
                                }}
                                placeholder="billing-service"
                                className={cn(FIELD, "mt-0 font-mono")}
                            />
                        </PopoverContent>
                    </Popover>

                    <CreateProjectDialogRepository
                        org={org}
                        selectedRepo={selectedRepo}
                        setSelectedRepo={setSelectedRepo}
                        selectedBranch={selectedBranch}
                        setSelectedBranch={setSelectedBranch}
                    />
                </div>

                <div className="flex h-fit items-center justify-end gap-x-2">
                    {mustCreateProject && (
                        <span className="mr-auto text-xs text-white/45">
                            Every organization needs at least one project to continue.
                        </span>
                    )}
                    {slugTaken && (
                        <span className="text-xs text-red-400">That slug is already taken.</span>
                    )}
                    <Button
                        type="button"
                        variant="unstyled"
                        size="xs"
                        onClick={onCancel}
                        disabled={createProject.isPending}
                        className="cursor-pointer px-2 text-xs text-white/50 hover:text-white/80"
                    >
                        {mustCreateProject ? "Log out" : "Cancel"}
                    </Button>
                    <Button
                        type="button"
                        variant="tertiary"
                        size="xs"
                        className="text-ink!"
                        onClick={submit}
                        loading={createProject.isPending}
                        disabled={!ready}
                    >
                        Create Project
                    </Button>
                </div>
            </section>
        </main>
    );
}
