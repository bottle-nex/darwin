"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
    useWatch,
    type Control,
    type FieldErrors,
    type UseFormRegister,
    type UseFormSetValue,
} from "react-hook-form";
import { PiSmileyFill } from "react-icons/pi";
import IconPicker, { IconPickGlyph, type IconPick } from "@/components/ui/IconPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/format";
import type { GithubRepo, Organization } from "@/types/organization";
import { FIELD, SURFACE } from "./CreateProjectDialog";
import CreateProjectDialogRepository from "./CreateProjectDialogRepository";

export type FormValues = {
    name: string;
    slug: string;
    description: string;
};

interface Props {
    formId: string;
    onSubmit: React.FormEventHandler<HTMLFormElement>;
    register: UseFormRegister<FormValues>;
    control: Control<FormValues>;
    setValue: UseFormSetValue<FormValues>;
    errors: FieldErrors<FormValues>;
    slugTaken: boolean;
    org: Organization | undefined;
    detailsReady: boolean;
    selectedRepo: GithubRepo | null;
    setSelectedRepo: (repo: GithubRepo | null) => void;
    selectedBranch: string;
    setSelectedBranch: (branch: string) => void;
}

export default function CreateProjectDialogDetailsStep({
    formId,
    onSubmit,
    register,
    control,
    setValue,
    errors,
    slugTaken,
    org,
    detailsReady,
    selectedRepo,
    setSelectedRepo,
    selectedBranch,
    setSelectedBranch,
}: Props) {
    const [slugEdited, setSlugEdited] = useState(false);
    const [icon, setIcon] = useState<IconPick | null>(null);
    const [iconPickerOpen, setIconPickerOpen] = useState(false);
    const description = useWatch({ control, name: "description" });

    const nameField = register("name", {
        required: "Name is required",
        validate: (value) => value.trim().length > 0 || "Name is required",
    });
    const slugField = register("slug");

    return (
        <div className="flex h-96">
            <form
                id={formId}
                onSubmit={onSubmit}
                className="flex flex-[3] flex-col gap-4 px-5 py-5"
            >
                <div>
                    <Label htmlFor="project-name" className="text-neutral-300">
                        Name
                    </Label>
                    <div className="mt-1.5 flex items-center gap-2">
                        <IconPicker
                            open={iconPickerOpen}
                            onOpenChange={setIconPickerOpen}
                            onSelect={setIcon}
                        >
                            <Button
                                variant="unstyled"
                                type="button"
                                aria-label="Pick project icon"
                                className={cn(
                                    "flex size-10 shrink-0 cursor-pointer items-center justify-center transition-colors hover:bg-white/10",
                                    SURFACE,
                                )}
                            >
                                {icon ? (
                                    <IconPickGlyph pick={icon} className="size-5 text-xl" />
                                ) : (
                                    <PiSmileyFill className="size-5 text-neutral-500" aria-hidden />
                                )}
                            </Button>
                        </IconPicker>
                        <Input
                            id="project-name"
                            {...nameField}
                            onChange={(e) => {
                                nameField.onChange(e);
                                if (!slugEdited) setValue("slug", slugify(e.target.value));
                            }}
                            placeholder="Billing Service"
                            autoFocus
                            className={cn(FIELD, "mt-0")}
                        />
                    </div>
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
                        <p className="mt-1.5 text-xs text-red-400">That slug is already taken.</p>
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
                            "mt-1.5 w-full resize-none px-3 py-2 text-sm text-neutral-200 outline-none placeholder:text-neutral-500 focus-visible:ring-[3px] focus-visible:ring-matcha/30",
                            SURFACE,
                        )}
                    />
                    <p className="mt-1 text-right text-xs text-neutral-500">
                        {description?.length ?? 0}/150
                    </p>
                </div>
            </form>

            <div className="my-5 w-px shrink-0 bg-white/10" />

            <CreateProjectDialogRepository
                org={org}
                detailsReady={detailsReady}
                selectedRepo={selectedRepo}
                setSelectedRepo={setSelectedRepo}
                selectedBranch={selectedBranch}
                setSelectedBranch={setSelectedBranch}
            />
        </div>
    );
}
