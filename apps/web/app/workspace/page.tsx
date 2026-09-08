"use client";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateOrganization } from "@/hooks/playground/useCreateOrganization";
import { ORGANIZATIONS_QUERY_KEY } from "@/hooks/playground/useFetchOrganizations";
import { slugify } from "@/lib/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useNewProjectStore } from "@/store/project/useNewProjectStore";
import type { Organization } from "@/types/organization";

const GRADIENT = [
    "radial-gradient(120% 110% at 100% 100%, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.7) 32%, rgba(10,10,10,0) 66%)",
    "radial-gradient(85% 62% at 0% -16%, rgba(20,20,20,0.75) 0%, rgba(16,16,16,0.32) 22%, rgba(13,13,13,0.1) 44%, rgba(10,10,10,0) 62%)",
    "radial-gradient(65% 48% at -18% 60%, rgba(15,15,15,0.28) 0%, rgba(12,12,12,0.1) 32%, rgba(10,10,10,0) 60%)",
    "linear-gradient(148deg, #141414 0%, #101010 10%, #0d0d0d 20%, #0b0b0b 32%, #0a0a0a 44%, #0a0a0a 100%)",
].join(", ");

const URL_PREFIX = "trydarwin.com/";

const DESCRIPTION_LIMIT = 150;

const SLUG_LIMIT = 50;

const CONTROL =
    "h-10.75 w-full rounded-xl border border-snow/8 bg-ink px-3.5 text-[14px] text-neutral-100 shadow-none transition-colors placeholder:text-neutral-600 hover:bg-charcoal focus-visible:bg-cement bg-charcoal";

const INPUT_SURFACE = "bg-[#121213] hover:bg-[#121213] focus-visible:bg-[#121213]";

const LABEL = "text-[12.5px] font-normal text-neutral-500";

export default function WorkspacePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const createOrganization = useCreateOrganization();
    const setOpen = useNewProjectStore((s) => s.setOpen);
    const setTargetOrgSlug = useNewProjectStore((s) => s.setTargetOrgSlug);
    const setForceCreate = useNewProjectStore((s) => s.setForceCreate);

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [slugEdited, setSlugEdited] = useState(false);
    const [description, setDescription] = useState("");

    const resolvedSlug = slug.trim() || slugify(name.trim());
    const ready = Boolean(name.trim()) && Boolean(resolvedSlug) && !createOrganization.isPending;
    const slugTaken =
        isAxiosError(createOrganization.error) &&
        createOrganization.error.response?.data?.error?.code === "SLUG_TAKEN";

    function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!ready) return;
        const trimmedName = name.trim();
        const trimmedDescription = description.trim();

        createOrganization.mutate(
            {
                name: trimmedName,
                slug: resolvedSlug,
                description: trimmedDescription || undefined,
            },
            {
                onSuccess: ({ id }) => {
                    const workspace: Organization = {
                        id,
                        name: trimmedName,
                        slug: resolvedSlug,
                        description: trimmedDescription || null,
                        createdAt: new Date().toISOString(),
                        memberCount: 1,
                        projectCount: 0,
                        githubConnected: false,
                        role: "Owner",
                    };
                    queryClient.setQueryData<Organization[]>(ORGANIZATIONS_QUERY_KEY, (old) => [
                        workspace,
                        ...(old ?? []),
                    ]);
                    setTargetOrgSlug(resolvedSlug);
                    setForceCreate(true);
                    setOpen(true);
                    router.replace(`/playground/${resolvedSlug}`);
                },
                onError: (error) => {
                    if (isAxiosError(error) && error.response?.data?.error?.code === "SLUG_TAKEN") {
                        return;
                    }
                    toast.error("Couldn't create the workspace.");
                },
            },
        );
    }

    return (
        <main className="theme-playground relative h-dvh w-full overflow-hidden bg-ink">
            <div className="absolute inset-0" style={{ backgroundImage: GRADIENT }} />
            <svg
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.035]"
            >
                <filter id="workspace-grain">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.9"
                        numOctaves="1"
                        stitchTiles="stitch"
                    />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#workspace-grain)" />
            </svg>

            <div className="relative z-10 flex h-full items-center justify-center px-6">
                <div className="w-full max-w-100">
                    <h1 className="text-center text-2xl font-semibold text-neutral-100">
                        Create Organization
                    </h1>
                    <p className="mt-2 text-center text-[15px] text-neutral-400">
                        Move work forward across teams and agents
                    </p>

                    <form onSubmit={submit} className="mt-10 flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="workspace-name" className={LABEL}>
                                Name
                            </Label>
                            <Input
                                id="workspace-name"
                                autoFocus
                                value={name}
                                placeholder="Acme Labs"
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (!slugEdited) setSlug(slugify(e.target.value));
                                }}
                                className={cn(CONTROL, INPUT_SURFACE)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="workspace-slug" className={LABEL}>
                                URL
                            </Label>
                            <div className={cn(CONTROL, "flex items-stretch overflow-hidden px-0")}>
                                <span className="flex shrink-0 items-center border-r border-graphite px-3.5 text-[14px] text-neutral-500">
                                    {URL_PREFIX}
                                </span>
                                <Input
                                    id="workspace-slug"
                                    value={slug}
                                    placeholder="acme-labs"
                                    maxLength={SLUG_LIMIT}
                                    onChange={(e) => {
                                        setSlugEdited(true);
                                        setSlug(slugify(e.target.value));
                                    }}
                                    className={cn(
                                        CONTROL,
                                        INPUT_SURFACE,
                                        "h-full flex-1 rounded-none border-0",
                                    )}
                                />
                            </div>
                            {slugTaken && (
                                <p className="text-[12px] text-red-400">
                                    That slug is already taken.
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="workspace-description" className={LABEL}>
                                Description
                                <span className="ml-1 text-neutral-600">(optional)</span>
                            </Label>
                            <Textarea
                                id="workspace-description"
                                value={description}
                                maxLength={DESCRIPTION_LIMIT}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What does this workspace do?"
                                className={cn(CONTROL, INPUT_SURFACE, "h-auto min-h-20 py-2.5")}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={!ready}
                            loading={createOrganization.isPending}
                            className={cn(
                                CONTROL,
                                "mt-4 justify-center font-medium hover:bg-cement",
                            )}
                        >
                            Create workspace
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    );
}
