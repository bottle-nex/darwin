"use client";
import { useState } from "react";
import { isAxiosError } from "axios";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DIALOG_TITLE_FIELD, GHOST_FIELD } from "@/components/ui/fieldStyles";
import { CapsuleTrigger } from "@/components/playground/Issue/Capsule";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/format";
import { useCreateOrganization } from "@/hooks/playground/useCreateOrganization";
import { ORGANIZATIONS_QUERY_KEY } from "@/hooks/playground/useFetchOrganizations";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import { FIELD } from "@/components/project/CreateProjectDialog";
import type { Organization } from "@/types/organization";

const NAME_LIMIT = 80;

const DESCRIPTION_LIMIT = 150;

export default function CreateOrganizationForm({
    onSuccess,
    onCancel,
}: {
    onSuccess: (org: Organization) => void;
    onCancel?: () => void;
}) {
    const queryClient = useQueryClient();
    const createOrganization = useCreateOrganization();
    const user = useUserSessionStore((s) => s.session?.user);

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [slugEdited, setSlugEdited] = useState(false);
    const [slugOpen, setSlugOpen] = useState(false);
    const [description, setDescription] = useState("");

    const ready = Boolean(name.trim()) && !createOrganization.isPending;
    const slugTaken =
        isAxiosError(createOrganization.error) &&
        createOrganization.error.response?.data?.error?.code === "SLUG_TAKEN";

    function submit() {
        if (!ready) return;
        const trimmed = name.trim();
        const finalSlug = slug.trim() || slugify(trimmed);
        const trimmedDescription = description.trim() || null;

        createOrganization.mutate(
            { name: trimmed, slug: finalSlug, description: trimmedDescription ?? undefined },
            {
                onSuccess: ({ id }) => {
                    const newOrg: Organization = {
                        id,
                        name: trimmed,
                        slug: finalSlug,
                        description: trimmedDescription,
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

                    onSuccess(newOrg);
                },
            },
        );
    }

    const ownerInitial = (user?.name?.trim() ?? user?.email ?? "?").slice(0, 2);

    return (
        <main className="flex min-h-0 min-w-0 flex-1 flex-col justify-between *:px-6">
            <section className="flex flex-col items-start gap-y-3 pt-4 pb-2">
                <div className="flex items-center justify-start gap-x-1 text-snow text-xs">
                    <PlaygroundAvatar letter={ownerInitial} tone="emerald" className="uppercase" />
                    <span>
                        <MdOutlineKeyboardArrowRight />
                    </span>
                    <span className="text-sm">New Organization</span>
                </div>
                <Textarea
                    rows={1}
                    autoFocus
                    placeholder="Organization name"
                    maxLength={NAME_LIMIT}
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
                <Textarea
                    rows={3}
                    placeholder="What does this organization work on?"
                    maxLength={DESCRIPTION_LIMIT}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={cn(GHOST_FIELD, "text-[15px] text-neutral-300")}
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
                                placeholder="acme-labs"
                                className={cn(FIELD, "mt-0 font-mono")}
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
                    {onCancel && (
                        <Button
                            type="button"
                            variant="unstyled"
                            size="xs"
                            onClick={onCancel}
                            disabled={createOrganization.isPending}
                            className="cursor-pointer px-2 text-xs text-white/50 hover:text-white/80"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="tertiary"
                        size="xs"
                        className="text-ink!"
                        onClick={submit}
                        loading={createOrganization.isPending}
                        disabled={!ready}
                    >
                        Create Organization
                    </Button>
                </div>
            </section>
        </main>
    );
}
