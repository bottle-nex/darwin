"use client";
import { CheckIcon, DropdownCaretIcon } from "@trymatcha/ui/icons";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { cn } from "@/lib/utils";

import PlaygroundAvatar, { toneFor } from "../components/PlaygroundAvatar";
import PlaygroundSearchInput from "../components/PlaygroundSearchInput";

export const DEFAULT_FOLDER_COLOR = "#6366f1";

export default function PlaygroundProjectSwitcher() {
    const router = useRouter();
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const projects = dashboard?.projects ?? [];
    const active = projects.find((p) => p.slug === projectSlug);
    const filtered = projects.filter((p) =>
        p.name.toLowerCase().includes(query.trim().toLowerCase()),
    );

    function selectProject(slug: string) {
        setOpen(false);
        setQuery("");
        if (slug !== projectSlug) router.push(`/playground/${orgSlug}/${slug}`);
    }

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) setQuery("");
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="unstyled"
                    type="button"
                    className="flex h-7 min-w-0 cursor-pointer items-center gap-1.5 rounded-sm px-2 text-[15px] font-semibold text-neutral-100 transition-colors hover:bg-white/8 data-[state=open]:bg-white/8"
                >
                    <PlaygroundAvatar
                        tone={active ? toneFor(active.id) : "indigo"}
                        icon={active?.icon}
                        letter={active?.name.slice(0, 2).toUpperCase() ?? "?"}
                    />
                    <span className="min-w-0 truncate">{active?.name ?? "Select a project"}</span>
                    <DropdownCaretIcon className="size-4 shrink-0 text-neutral-500" aria-hidden />
                </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-72 p-1.5">
                <PlaygroundSearchInput
                    value={query}
                    onChange={setQuery}
                    onClose={() => setOpen(false)}
                    placeholder="Search projects..."
                />
                <div
                    data-lenis-prevent
                    className="mt-1.5 flex max-h-72 flex-col gap-px overflow-y-auto"
                >
                    {filtered.length === 0 ? (
                        <div className="px-2 py-3 text-center text-[12px] text-neutral-500">
                            No projects found.
                        </div>
                    ) : (
                        filtered.map((p) => (
                            <Button
                                variant="unstyled"
                                key={p.id}
                                type="button"
                                onClick={() => selectProject(p.slug)}
                                className={cn(
                                    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] outline-none transition-colors select-none",
                                    p.slug === projectSlug
                                        ? "bg-white/8 text-neutral-100"
                                        : "text-neutral-300 hover:bg-white/5 hover:text-neutral-100",
                                )}
                            >
                                <PlaygroundAvatar
                                    tone={toneFor(p.id)}
                                    icon={p.icon}
                                    letter={p.name.slice(0, 2).toUpperCase()}
                                />
                                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                                {p.slug === projectSlug && (
                                    <CheckIcon
                                        className="size-3.5 shrink-0 text-neutral-400"
                                        aria-hidden
                                    />
                                )}
                            </Button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
