"use client";
import { useState } from "react";
import { MdCheck, MdColorize, MdOutlineKeyboardArrowRight } from "react-icons/md";
import { toast } from "@/lib/toast";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorPicker } from "@/components/ui/color-picker";
import { DIALOG_TITLE_FIELD, GHOST_FIELD } from "@/components/ui/fieldStyles";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { cn } from "@/lib/utils";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useCreateTag } from "@/hooks/tags/useCreateTag";
import { useUpdateTag } from "@/hooks/tags/useUpdateTag";
import { TAG_COLORS, type Tag } from "@/types/tags";
import type { ApiResponse } from "@/types/api";
import TagDisplay from "./TagDisplay";

const NAME_LIMIT = 50;

const LABEL = "text-[12.5px] font-normal text-neutral-500";

const SWATCH = "flex size-7 items-center justify-center rounded-full transition-all cursor-pointer";

const SWATCH_STATE = {
    on: "ring-2 ring-white/80 ring-offset-2 ring-offset-charcoal",
    off: "ring-1 ring-white/10 hover:ring-white/30",
};

type CreateTagDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    tag?: Tag;
};

export default function CreateTagDialog({
    open,
    onOpenChange,
    projectId,
    tag,
}: CreateTagDialogProps) {
    if (!open) return null;
    return (
        <Dialog open onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    (event.currentTarget as HTMLElement).focus();
                }}
                className={cn(
                    "flex flex-col max-h-[80vh] min-h-[40vh] w-130 max-w-none sm:max-w-none p-0 gap-0 overflow-hidden",
                    "bg-charcoal rounded-3xl",
                )}
            >
                <DialogTitle className="sr-only">{tag ? "Edit tag" : "New tag"}</DialogTitle>
                <TagForm projectId={projectId} tag={tag} onDone={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}

function TagForm({ projectId, tag, onDone }: { projectId: string; tag?: Tag; onDone: () => void }) {
    const project = useActiveProject();
    const createTag = useCreateTag();
    const updateTag = useUpdateTag();

    const [name, setName] = useState(tag?.name ?? "");
    const [color, setColor] = useState(tag?.color ?? TAG_COLORS[0]);

    const pending = createTag.isPending || updateTag.isPending;
    const ready = Boolean(name.trim()) && !pending;
    const customActive = !TAG_COLORS.includes(color);

    function handleError(error: unknown) {
        const code =
            error instanceof AxiosError
                ? (error.response?.data as ApiResponse<unknown> | undefined)?.error?.code
                : undefined;
        toast.error(
            code === "TAG_EXISTS"
                ? "A tag with this name already exists."
                : "Couldn't save the tag.",
        );
    }

    function submit() {
        if (!ready) return;
        const trimmed = name.trim();

        if (tag) {
            updateTag.mutate(
                { projectId, tagId: tag.id, name: trimmed, color },
                {
                    onSuccess: () => {
                        toast.success("Tag updated.");
                        onDone();
                    },
                    onError: handleError,
                },
            );
            return;
        }

        createTag.mutate(
            { projectId, name: trimmed, color },
            {
                onSuccess: () => {
                    toast.success("Tag created.");
                    onDone();
                },
                onError: handleError,
            },
        );
    }

    return (
        <main className="flex min-h-0 min-w-0 flex-1 flex-col justify-between *:px-6">
            <section className="flex flex-col items-start gap-y-3 pt-4 pb-2">
                <div className="flex items-center justify-start gap-x-1 text-snow text-xs">
                    <PlaygroundAvatar
                        letter={project?.name.slice(0, 2) ?? ""}
                        tone="emerald"
                        className="uppercase"
                    />
                    <span>
                        <MdOutlineKeyboardArrowRight />
                    </span>
                    <span className="text-sm">{tag ? "Edit Tag" : "New Tag"}</span>
                </div>
                <Textarea
                    rows={1}
                    autoFocus
                    placeholder="Tag name"
                    maxLength={NAME_LIMIT}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                    className={cn(GHOST_FIELD, DIALOG_TITLE_FIELD)}
                />
            </section>

            <section
                data-lenis-prevent
                className="no-scrollbar flex flex-1 min-h-0 flex-col gap-y-5 overflow-y-auto pb-4"
            >
                <div className="flex flex-col gap-y-2">
                    <span className={LABEL}>Color</span>
                    <div className="flex flex-wrap gap-2">
                        {TAG_COLORS.map((swatch) => (
                            <Button
                                variant="unstyled"
                                key={swatch}
                                type="button"
                                onClick={() => setColor(swatch)}
                                aria-label={`Use color ${swatch}`}
                                aria-pressed={swatch === color}
                                className={cn(
                                    SWATCH,
                                    swatch === color ? SWATCH_STATE.on : SWATCH_STATE.off,
                                )}
                                style={{ backgroundColor: swatch }}
                            >
                                {swatch === color && (
                                    <MdCheck className="size-3.5 text-neutral-900" />
                                )}
                            </Button>
                        ))}

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="unstyled"
                                    type="button"
                                    aria-label="Choose a custom color"
                                    aria-pressed={customActive}
                                    className={cn(
                                        SWATCH,
                                        customActive ? SWATCH_STATE.on : SWATCH_STATE.off,
                                    )}
                                    style={{
                                        background: customActive
                                            ? color
                                            : "conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
                                    }}
                                >
                                    {customActive ? (
                                        <MdCheck className="size-3.5 text-neutral-900" />
                                    ) : (
                                        <MdColorize className="size-3.5 text-white drop-shadow" />
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto">
                                <ColorPicker value={color} onChange={setColor} />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="flex flex-col items-start gap-y-2">
                    <span className={LABEL}>Preview</span>
                    <TagDisplay name={name.trim() || "preview"} color={color} />
                </div>
            </section>

            <section className="flex h-fit items-center justify-end gap-x-2 pb-4">
                <Button
                    type="button"
                    variant="tertiary"
                    size="xs"
                    className="text-ink!"
                    onClick={submit}
                    loading={pending}
                    disabled={!ready}
                >
                    {tag ? "Save" : "Create Tag"}
                </Button>
            </section>
        </main>
    );
}
