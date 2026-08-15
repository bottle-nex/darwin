"use client";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { isAxiosError } from "axios";
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
import { slugify } from "@/lib/format";
import { useNewTeamStore } from "@/store/team/useNewTeamStore";
import { useCreateTeam } from "@/hooks/team/useCreateTeam";

const FORM_ID = "create-team-form";

const FIELD =
    "mt-1.5 border-white/10 bg-white/5 text-neutral-200 placeholder:text-neutral-500 focus-visible:border-matcha focus-visible:ring-matcha/30";

const SURFACE = "rounded-lg bg-white/5 shadow-[inset_0_1px_0_0_var(--color-edge)]";

type FormValues = {
    name: string;
    slug: string;
    description: string;
};

export default function CreateTeamDialog() {
    const { open, setOpen, targetProjectId, setTargetProjectId } = useNewTeamStore();
    const createTeam = useCreateTeam();

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

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (!next) {
            reset();
            setSlugEdited(false);
            setTargetProjectId(null);
            createTeam.reset();
        }
    }

    const onSubmit = handleSubmit((values) => {
        if (!targetProjectId) return;
        const trimmed = values.name.trim();
        const teamSlug = values.slug.trim() || slugify(trimmed);
        const desc = values.description.trim();

        createTeam.mutate(
            {
                projectId: targetProjectId,
                name: trimmed,
                slug: teamSlug,
                description: desc || undefined,
            },
            {
                onSuccess: () => handleOpenChange(false),
            },
        );
    });

    const slugTaken =
        isAxiosError(createTeam.error) &&
        createTeam.error.response?.data?.error?.code === "SLUG_TAKEN";

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="gap-0 overflow-hidden border-white/10 bg-charcoal p-0 sm:max-w-lg"
            >
                <div className="flex items-start justify-between gap-4 px-5 py-4">
                    <DialogHeader className="gap-1">
                        <DialogTitle className="text-base text-neutral-100">
                            Create team
                        </DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500">
                            Teams group the people who own work within a project.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            type="button"
                            variant="tertiary"
                            size="sm"
                            onClick={() => handleOpenChange(false)}
                            disabled={createTeam.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form={FORM_ID}
                            size="sm"
                            loading={createTeam.isPending}
                            disabled={!detailsReady || !targetProjectId || createTeam.isPending}
                        >
                            Create Team
                        </Button>
                    </div>
                </div>

                <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-4 px-5 pb-5">
                    <div>
                        <Label htmlFor="team-name" className="text-neutral-300">
                            Name
                        </Label>
                        <Input
                            id="team-name"
                            {...nameField}
                            onChange={(e) => {
                                nameField.onChange(e);
                                if (!slugEdited) setValue("slug", slugify(e.target.value));
                            }}
                            placeholder="Frontend"
                            autoFocus
                            className={FIELD}
                        />
                        {errors.name && (
                            <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="team-slug" className="text-neutral-300">
                            Slug
                        </Label>
                        <div className="relative">
                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm text-neutral-600">
                                @
                            </span>
                            <Input
                                id="team-slug"
                                {...slugField}
                                onChange={(e) => {
                                    setSlugEdited(true);
                                    setValue("slug", slugify(e.target.value));
                                }}
                                placeholder="frontend"
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
                        <Label htmlFor="team-description" className="text-neutral-300">
                            Description
                            <span className="ml-1 text-neutral-600">(optional)</span>
                        </Label>
                        <textarea
                            id="team-description"
                            {...register("description")}
                            maxLength={150}
                            placeholder="What does this team own?"
                            rows={4}
                            className={cn(
                                "mt-1.5 w-full resize-none px-3 py-2 text-sm text-neutral-200 outline-none placeholder:text-neutral-500 focus-visible:ring-[3px] focus-visible:ring-matcha/30",
                                SURFACE,
                            )}
                        />
                        <p className="mt-1 text-right text-xs text-neutral-500">
                            {description?.length ?? 0}/150
                        </p>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
