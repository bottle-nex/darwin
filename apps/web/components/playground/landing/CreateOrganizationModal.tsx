"use client";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { IoIosCheckmark } from "react-icons/io";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateOrganization } from "@/hooks/playground/useCreateOrganization";
import { ORGANIZATIONS_QUERY_KEY } from "@/hooks/playground/useFetchOrganizations";
import type { Organization } from "@/types/organization";

const FIELD =
    "mt-1.5 border-white/10 bg-white/5 text-neutral-200 placeholder:text-neutral-500 focus-visible:border-matcha focus-visible:ring-matcha/30";

type FormValues = {
    name: string;
    slug: string;
    description: string;
};

export default function CreateOrganizationModal({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
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

    const queryClient = useQueryClient();
    const { mutate, isPending } = useCreateOrganization();
    const [slugEdited, setSlugEdited] = useState<boolean>(false);
    const name = useWatch({ control, name: "name" });
    const description = useWatch({ control, name: "description" });

    const nameField = register("name", {
        required: "Name is required",
        validate: (value) => value.trim().length > 0 || "Name is required",
    });
    const slugField = register("slug");

    function handleOpenChange(next: boolean) {
        onOpenChange(next);
        if (!next) {
            reset();
            setSlugEdited(false);
        }
    }

    const onSubmit = handleSubmit((values) => {
        const trimmed = values.name.trim();

        const slug = values.slug.trim() || slugify(trimmed);
        const description = values.description.trim() || null;

        mutate(
            { name: trimmed, slug, description: description ?? undefined },
            {
                onSuccess: ({ id }) => {
                    const newOrg: Organization = {
                        id,
                        name: trimmed,
                        slug,
                        description,
                        createdAt: new Date().toISOString(),
                        memberCount: 1,
                        projectCount: 0,
                        githubConnected: false,
                        role: "Owner",
                    };

                    queryClient.setQueryData<Organization[]>(ORGANIZATIONS_QUERY_KEY, (old) => [
                        newOrg,
                        ...(old ?? []),
                    ]);

                    handleOpenChange(false);
                },
            },
        );
    });

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="border-white/10 bg-charcoal sm:max-w-105">
                <DialogHeader>
                    <DialogTitle className="text-neutral-100">Create organization</DialogTitle>
                    <DialogDescription className="text-neutral-500">
                        Organizations group your projects, teams, and the issues your agents pick
                        up.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="flex flex-col gap-4 py-2">
                    <div>
                        <Label htmlFor="org-name" className="text-neutral-300">
                            Name
                        </Label>
                        <Input
                            id="org-name"
                            {...nameField}
                            onChange={(e) => {
                                nameField.onChange(e);
                                if (!slugEdited) setValue("slug", slugify(e.target.value));
                            }}
                            placeholder="Acme Labs"
                            autoFocus
                            className={FIELD}
                        />
                        {errors.name && (
                            <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="org-slug" className="text-neutral-300">
                            Slug
                        </Label>
                        <div className="relative">
                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm text-neutral-600">
                                @
                            </span>
                            <Input
                                id="org-slug"
                                {...slugField}
                                onChange={(e) => {
                                    setSlugEdited(true);
                                    setValue("slug", slugify(e.target.value));
                                }}
                                placeholder="acme-labs"
                                className={`${FIELD} pl-7 font-mono`}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="org-description" className="text-neutral-300">
                            Description
                            <span className="ml-1 text-neutral-600">(optional)</span>
                        </Label>
                        <textarea
                            id="org-description"
                            {...register("description")}
                            maxLength={150}
                            placeholder="What does this organization work on?"
                            rows={4}
                            className="mt-1.5 w-full resize-none rounded-md bg-white/5 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 outline-none focus-visible:border-matcha focus-visible:ring-[3px] focus-visible:ring-matcha/30 shadow-[inset_0_1px_0_0_var(--color-edge)]"
                        />
                        <p className="mt-1 text-right text-xs text-neutral-500">
                            {description?.length ?? 0}/150
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant={"tertiary"}
                            onClick={() => handleOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" loading={isPending} disabled={!name?.trim()}>
                            Create Org
                            {!isPending && name?.trim() && <IoIosCheckmark />}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
