"use client";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { MdCheck, MdColorize } from "react-icons/md";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";
import { useCreateTag } from "@/hooks/tags/useCreateTag";
import { useUpdateTag } from "@/hooks/tags/useUpdateTag";
import { TAG_COLORS, type Tag } from "@/types/tags";
import type { ApiResponse } from "@/types/api";
import TagDisplay from "./TagDisplay";

const FIELD =
    "mt-1.5 border-white/10 bg-white/5 text-neutral-200 placeholder:text-neutral-500 focus-visible:border-[#9bc24f] focus-visible:ring-[#9bc24f]/30";

type FormValues = {
    name: string;
    color: string;
};

type TagFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    tag?: Tag;
};

export default function TagFormDialog({ open, onOpenChange, projectId, tag }: TagFormDialogProps) {
    const isEdit = Boolean(tag);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: { name: "", color: TAG_COLORS[0] },
    });

    const createTag = useCreateTag();
    const updateTag = useUpdateTag();
    const isPending = createTag.isPending || updateTag.isPending;

    const name = useWatch({ control, name: "name" });
    const color = useWatch({ control, name: "color" });

    // Sync the form to the tag being edited (or reset to defaults) when opened.
    useEffect(() => {
        if (open) {
            reset({ name: tag?.name ?? "", color: tag?.color ?? TAG_COLORS[0] });
        }
    }, [open, tag, reset]);

    const nameField = register("name", {
        required: "Name is required",
        maxLength: { value: 50, message: "Name must be 50 characters or fewer" },
        validate: (value) => value.trim().length > 0 || "Name is required",
    });

    function handleOpenChange(next: boolean) {
        onOpenChange(next);
        if (!next) {
            reset({ name: "", color: TAG_COLORS[0] });
            createTag.reset();
            updateTag.reset();
        }
    }

    const onSubmit = handleSubmit((values) => {
        const trimmed = values.name.trim();
        if (!trimmed) return;

        function handleError(err: unknown) {
            const code =
                err instanceof AxiosError
                    ? (err.response?.data as ApiResponse<unknown> | undefined)?.error?.code
                    : undefined;
            if (code === "TAG_EXISTS") {
                toast.error("A tag with this name already exists.");
            } else {
                toast.error("Couldn't save the tag.");
            }
        }

        if (tag) {
            updateTag.mutate(
                { projectId, tagId: tag.id, name: trimmed, color: values.color },
                {
                    onSuccess: () => {
                        toast.success("Tag updated.");
                        handleOpenChange(false);
                    },
                    onError: handleError,
                },
            );
        } else {
            createTag.mutate(
                { projectId, name: trimmed, color: values.color },
                {
                    onSuccess: () => {
                        toast.success("Tag created.");
                        handleOpenChange(false);
                    },
                    onError: handleError,
                },
            );
        }
    });

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="bg-charcoal sm:max-w-105">
                <DialogHeader>
                    <DialogTitle className="text-neutral-100">
                        {isEdit ? "Edit tag" : "New tag"}
                    </DialogTitle>
                    <DialogDescription className="text-neutral-500">
                        Tags are labels you put on issues so you can group and find them, like
                        labels on GitHub.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="flex flex-col gap-4 py-2">
                    <div>
                        <Label htmlFor="tag-name" className="text-neutral-300">
                            Name
                        </Label>
                        <Input
                            id="tag-name"
                            {...nameField}
                            placeholder="bug"
                            autoFocus
                            maxLength={50}
                            className={FIELD}
                        />
                        {errors.name && (
                            <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <Label className="text-neutral-300">Color</Label>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                            {TAG_COLORS.map((c) => {
                                const selected = c === color;
                                return (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setValue("color", c)}
                                        aria-label={`Use color ${c}`}
                                        aria-pressed={selected}
                                        className={cn(
                                            "flex size-7 items-center justify-center rounded-full transition-all cursor-pointer",
                                            selected
                                                ? "ring-2 ring-white/80 ring-offset-2 ring-offset-charcoal"
                                                : "ring-1 ring-white/10 hover:ring-white/30",
                                        )}
                                        style={{ backgroundColor: c }}
                                    >
                                        {selected && (
                                            <MdCheck className="size-3.5 text-neutral-900" />
                                        )}
                                    </button>
                                );
                            })}

                            {(() => {
                                const customActive = !TAG_COLORS.includes(color);
                                return (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                aria-label="Choose a custom color"
                                                aria-pressed={customActive}
                                                className={cn(
                                                    "flex size-7 items-center justify-center rounded-full transition-all cursor-pointer",
                                                    customActive
                                                        ? "ring-2 ring-white/80 ring-offset-2 ring-offset-charcoal"
                                                        : "ring-1 ring-white/10 hover:ring-white/30",
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
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            align="start"
                                            className="w-auto border-white/10 bg-charcoal"
                                        >
                                            <ColorPicker
                                                value={color}
                                                onChange={(hex) => setValue("color", hex)}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                );
                            })()}
                        </div>
                    </div>

                    <div>
                        <Label className="text-neutral-300">Preview</Label>
                        <div className="mt-1.5">
                            <TagDisplay name={name?.trim() || "preview"} color={color} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="tertiary"
                            onClick={() => handleOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" loading={isPending} disabled={!name?.trim()}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
