"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/format";
import { useCreateOrganization } from "@/hooks/playground/useCreateOrganization";
import { ORGANIZATIONS_QUERY_KEY } from "@/hooks/playground/useFetchOrganizations";

const GRADIENT = [
    "radial-gradient(95% 85% at 100% 100%, #0c0c0c 0%, rgba(12,12,12,0.7) 30%, rgba(12,12,12,0) 62%)",
    "radial-gradient(105% 75% at 4% 0%, #212121 0%, rgba(33,33,33,0) 50%)",
    "radial-gradient(70% 50% at 0% 58%, rgba(26,26,26,0.7) 0%, rgba(26,26,26,0) 60%)",
    "radial-gradient(80% 60% at 74% 6%, rgba(26,26,26,0.6) 0%, rgba(26,26,26,0) 55%)",
    "linear-gradient(146deg, #212121 0%, #1a1a1a 24%, #141414 46%, #0c0c0c 70%, #0c0c0c 100%)",
].join(", ");

const URL_PREFIX = "trymatcha.com/";

const REGIONS = ["United States", "European Union"];

const FIELD =
    "h-11 rounded-[10px] px-4 text-[15px] text-neutral-100 shadow-none placeholder:text-neutral-600";

const FIELD_SURFACE = "bg-charcoal hover:bg-charcoal focus-visible:bg-cement transition-colors";

const LABEL = "text-[13px] font-normal text-neutral-500";

export default function WorkspacePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const createOrganization = useCreateOrganization();

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [slugEdited, setSlugEdited] = useState(false);
    const [region, setRegion] = useState(REGIONS[0]);

    const ready = Boolean(name.trim()) && !createOrganization.isPending;

    function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!ready) return;
        const trimmed = name.trim();

        createOrganization.mutate(
            { name: trimmed, slug: slug.trim() || slugify(trimmed) },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
                    router.push("/playground");
                },
                onError: () => toast.error("Couldn't create the workspace."),
            },
        );
    }

    return (
        <main className="theme-playground relative h-dvh w-full overflow-hidden bg-ink">
            <div
                className="absolute -inset-[30%] blur-[100px]"
                style={{ backgroundImage: GRADIENT }}
            />
            <svg
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16] mix-blend-overlay"
            >
                <filter id="workspace-grain">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.82"
                        numOctaves="4"
                        stitchTiles="stitch"
                    />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#workspace-grain)" />
            </svg>

            <div className="relative z-10 flex h-full items-center justify-center px-6">
                <div className="w-full max-w-120">
                    <h1 className="text-center text-2xl font-semibold text-neutral-100">
                        Create a workspace
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
                                variant="ghost"
                                autoFocus
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (!slugEdited) setSlug(slugify(e.target.value));
                                }}
                                className={cn(FIELD, FIELD_SURFACE)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="workspace-slug" className={LABEL}>
                                URL
                            </Label>
                            <div
                                className={cn(
                                    "flex h-13 items-stretch overflow-hidden rounded-[10px]",
                                    FIELD_SURFACE,
                                )}
                            >
                                <span className="flex shrink-0 items-center bg-cement px-4 text-[15px] text-neutral-500">
                                    {URL_PREFIX}
                                </span>
                                <Input
                                    id="workspace-slug"
                                    variant="ghost"
                                    value={slug}
                                    onChange={(e) => {
                                        setSlugEdited(true);
                                        setSlug(slugify(e.target.value));
                                    }}
                                    className={cn(
                                        FIELD,
                                        "h-full flex-1 rounded-none bg-transparent hover:bg-transparent",
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className={LABEL}>Region</Label>
                            <Select value={region} onValueChange={setRegion}>
                                <SelectTrigger
                                    className={cn(
                                        FIELD,
                                        "w-full bg-graphite hover:bg-graphite data-[size=default]:h-13",
                                    )}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {REGIONS.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="submit"
                            disabled={!ready}
                            loading={createOrganization.isPending}
                            className="mt-6 h-13 w-full justify-center rounded-full bg-graphite text-[15px] font-medium text-neutral-100 transition-[filter] hover:bg-graphite hover:brightness-125"
                        >
                            Create workspace
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    );
}
