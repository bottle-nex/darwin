"use client";
import { BreadcrumbSeparatorIcon } from "@trydarwin/ui/icons";
import { isAxiosError } from "axios";
import { useState } from "react";

import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { CapsuleTrigger } from "@/components/playground/Issue/Capsule";
import {
    Dialog,
    DIALOG_COMPOSER_SURFACE,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import DialogSubmitButton, { handleDialogSubmitKey } from "@/components/ui/DialogSubmitButton";
import { DIALOG_TITLE_FIELD, GHOST_FIELD } from "@/components/ui/fieldStyles";
import { type IconPick, IconPickButton, randomIconPick } from "@/components/ui/IconPicker";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTeam } from "@/hooks/team/useCreateTeam";
import { useActiveProject } from "@/hooks/useActiveProject";
import { slugify } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNewTeamStore } from "@/store/team/useNewTeamStore";

const DESCRIPTION_LIMIT = 150;

export default function CreateTeamDialog() {
    const { open, setOpen, targetProjectId, setTargetProjectId } = useNewTeamStore();

    if (!open) return null;
    return (
        <Dialog open onOpenChange={setOpen}>
            <DialogContent
                showCloseButton={false}
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    (event.currentTarget as HTMLElement).focus();
                }}
                className={cn(
                    "flex flex-col max-h-[80vh] min-h-[40vh] w-187.5 max-w-none sm:max-w-none p-0 gap-0 overflow-hidden",
                    DIALOG_COMPOSER_SURFACE,
                )}
            >
                <DialogTitle className="sr-only">Create team</DialogTitle>
                <CreateTeamForm
                    projectId={targetProjectId}
                    onClose={() => {
                        setOpen(false);
                        setTargetProjectId(null);
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}

function CreateTeamForm({ projectId, onClose }: { projectId: string | null; onClose: () => void }) {
    const project = useActiveProject();
    const createTeam = useCreateTeam();

    const [name, setName] = useState("");
    const [icon, setIcon] = useState<IconPick>(randomIconPick);
    const [iconOpen, setIconOpen] = useState(false);
    const [slug, setSlug] = useState("");
    const [slugEdited, setSlugEdited] = useState(false);
    const [slugOpen, setSlugOpen] = useState(false);
    const [description, setDescription] = useState("");

    const resolvedSlug = slug.trim() || slugify(name.trim());
    const ready =
        Boolean(name.trim()) &&
        Boolean(resolvedSlug) &&
        Boolean(projectId) &&
        !createTeam.isPending;
    const slugTaken =
        isAxiosError(createTeam.error) &&
        createTeam.error.response?.data?.error?.code === "SLUG_TAKEN";

    function submit() {
        if (!ready || !projectId) return;

        createTeam.mutate(
            {
                projectId,
                name: name.trim(),
                slug: resolvedSlug,
                description: description.trim() || undefined,
                icon,
            },
            { onSuccess: onClose },
        );
    }

    return (
        <main
            className="flex min-h-0 min-w-0 flex-1 flex-col justify-between *:px-6"
            onKeyDown={(event) => handleDialogSubmitKey(event, submit)}
        >
            <section className="flex flex-col items-start gap-y-3 pt-4 pb-2">
                <div className="flex items-center justify-start gap-x-1 text-snow text-xs">
                    <PlaygroundAvatar
                        letter={project?.name.slice(0, 2) ?? ""}
                        tone={project ? toneFor(project.id) : "emerald"}
                        icon={project?.icon}
                        size="xl"
                        className="uppercase"
                    />
                    <span>
                        <BreadcrumbSeparatorIcon />
                    </span>
                    <span className="text-sm">New Team</span>
                </div>
                <div className="flex w-full items-start gap-x-2">
                    <IconPickButton
                        pick={icon}
                        onSelect={setIcon}
                        open={iconOpen}
                        onOpenChange={setIconOpen}
                        label="Pick team icon"
                    />
                    <Textarea
                        rows={1}
                        autoFocus
                        placeholder="Team name"
                        maxLength={80}
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (!slugEdited) setSlug(slugify(e.target.value));
                        }}
                        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                        className={cn(GHOST_FIELD, DIALOG_TITLE_FIELD)}
                    />
                </div>
            </section>

            <section
                data-lenis-prevent
                className="no-scrollbar flex-1 min-h-0 overflow-y-auto pb-4"
            >
                <Textarea
                    rows={3}
                    placeholder="What does this team own?"
                    maxLength={DESCRIPTION_LIMIT}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={cn(GHOST_FIELD, "w-full text-base leading-[1.65] text-neutral-200")}
                />
            </section>

            <section className="flex flex-col gap-y-4 pb-4">
                <div className="flex items-center gap-x-2.5">
                    <Popover open={slugOpen} onOpenChange={setSlugOpen}>
                        <PopoverTrigger asChild>
                            <CapsuleTrigger>
                                <span className="font-mono text-white/40">@</span>
                                <span className="max-w-40 truncate font-mono">
                                    {resolvedSlug || "slug"}
                                </span>
                            </CapsuleTrigger>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-64 p-1.5">
                            <Input
                                autoFocus
                                value={slug}
                                maxLength={50}
                                onChange={(e) => {
                                    setSlugEdited(true);
                                    setSlug(slugify(e.target.value));
                                }}
                                placeholder="frontend"
                                className="font-mono"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="flex h-fit items-center justify-end gap-x-2">
                    {slugTaken && (
                        <span className="mr-auto text-xs text-red-400">
                            That slug is already taken.
                        </span>
                    )}
                    <DialogSubmitButton
                        label="Create Team"
                        onClick={submit}
                        loading={createTeam.isPending}
                        disabled={!ready}
                    />
                </div>
            </section>
        </main>
    );
}
