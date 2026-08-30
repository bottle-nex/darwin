"use client";
import { BreadcrumbSeparatorIcon } from "@trymatcha/ui/icons";
import { useState } from "react";

import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import Capsule from "@/components/playground/Issue/Capsule";
import { DATE_ICON_COLOR } from "@/components/playground/Issue/issueHelpers";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import DialogSubmitButton, { handleDialogSubmitKey } from "@/components/ui/DialogSubmitButton";
import { DIALOG_TITLE_FIELD, GHOST_FIELD } from "@/components/ui/fieldStyles";
import { type IconPick, IconPickButton } from "@/components/ui/IconPicker";
import { Textarea } from "@/components/ui/textarea";
import { useSpaces } from "@/hooks/issues/useBoardColumns";
import { useSpaceActions } from "@/hooks/kanban/useSpaceActions";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useSpaceFormStore } from "@/store/space/useSpaceFormStore";
import type { BoardSpace } from "@/types/board";

function SpaceForm({ space, projectSlug }: { space: BoardSpace | null; projectSlug: string }) {
    const project = useActiveProject();
    const close = useSpaceFormStore((s) => s.close);
    const openSpace = usePlaygroundNavStore((s) => s.openSpace);
    const selectedSpace = usePlaygroundNavStore((s) => s.selectedSpace);
    const { addSpace, editSpace, addingSpace, editingSpace } = useSpaceActions();
    const [name, setName] = useState(space?.name ?? "");
    const [description, setDescription] = useState(space?.description ?? "");
    const [icon, setIcon] = useState<IconPick | null>(space?.icon ?? null);
    const [startDate, setStartDate] = useState<Date | undefined>(
        space?.startDate ? new Date(space.startDate) : undefined,
    );
    const [targetDate, setTargetDate] = useState<Date | undefined>(
        space?.targetDate ? new Date(space.targetDate) : undefined,
    );
    const [iconOpen, setIconOpen] = useState(false);

    const dateRange = { from: startDate, to: targetDate };
    const saving = addingSpace || editingSpace;
    const ready = Boolean(name.trim()) && !saving;

    async function submit() {
        if (!ready) return;
        const draft = {
            name,
            description: description.trim() || null,
            startDate: startDate?.toISOString() ?? null,
            targetDate: targetDate?.toISOString() ?? null,
            icon,
        };
        if (space) {
            const updated = await editSpace(space.id, draft);
            if (!updated) return;
            if (selectedSpace?.id === updated.id) openSpace(updated, projectSlug);
        } else {
            const created = await addSpace(draft);
            if (!created) return;
            openSpace(created, projectSlug);
        }
        close();
    }

    return (
        <main
            className="flex min-w-0 flex-col *:px-6"
            onKeyDown={(event) => handleDialogSubmitKey(event, submit)}
        >
            <section className="flex flex-col items-start gap-y-3 pt-4 pb-2">
                <div className="flex items-center justify-start gap-x-1 text-snow text-xs">
                    <PlaygroundAvatar
                        letter={project?.name.slice(0, 2) ?? ""}
                        tone={project ? toneFor(project.id) : "emerald"}
                        icon={project?.icon}
                        className="uppercase"
                    />
                    <span>
                        <BreadcrumbSeparatorIcon />
                    </span>
                    <span className="text-sm">{space ? space.name : "New Space"}</span>
                </div>
                <div className="flex w-full items-start gap-2">
                    <IconPickButton
                        pick={icon}
                        onSelect={setIcon}
                        open={iconOpen}
                        onOpenChange={setIconOpen}
                        label="Pick space icon"
                        className="mt-1"
                    />
                    <Textarea
                        rows={1}
                        autoFocus
                        placeholder="Space name"
                        maxLength={60}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                submit();
                            }
                        }}
                        className={cn(GHOST_FIELD, DIALOG_TITLE_FIELD)}
                    />
                </div>
                <Textarea
                    rows={2}
                    placeholder="Describe what this space is for"
                    maxLength={280}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={cn(GHOST_FIELD, "text-[13px] text-neutral-400")}
                />
                <div className="flex items-center gap-2">
                    <Capsule
                        type="calendar"
                        placeholder="Start date"
                        value={startDate}
                        onChange={setStartDate}
                        iconClassName={DATE_ICON_COLOR.start}
                        range={dateRange}
                        latest={targetDate}
                    />
                    <Capsule
                        type="calendar"
                        placeholder="Target date"
                        value={targetDate}
                        onChange={setTargetDate}
                        iconClassName={DATE_ICON_COLOR.target}
                        range={dateRange}
                        earliest={startDate}
                    />
                </div>
            </section>

            <section className="flex h-fit items-center justify-end pb-4">
                <DialogSubmitButton
                    label={space ? "Save changes" : "Add space"}
                    onClick={submit}
                    loading={saving}
                    disabled={!ready}
                />
            </section>
        </main>
    );
}

export default function SpaceFormDialog({ projectSlug }: { projectSlug: string }) {
    const open = useSpaceFormStore((s) => s.open);
    const spaceId = useSpaceFormStore((s) => s.spaceId);
    const close = useSpaceFormStore((s) => s.close);
    const spaces = useSpaces(useActiveProject()?.id);
    const space = spaces.find((row) => row.id === spaceId) ?? null;

    return (
        <Dialog open={open} onOpenChange={(next) => !next && close()}>
            <DialogContent
                showCloseButton={false}
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    (event.currentTarget as HTMLElement).focus();
                }}
                className={cn(
                    "flex w-110 max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
                    "rounded-3xl",
                )}
            >
                <DialogTitle className="sr-only">
                    {space ? "Edit space" : "Create space"}
                </DialogTitle>
                <SpaceForm key={space?.id ?? "new"} space={space} projectSlug={projectSlug} />
            </DialogContent>
        </Dialog>
    );
}
