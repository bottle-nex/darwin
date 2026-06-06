"use client";
import { useParams, useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFetchOrganizations } from "@/hooks/playground/useFetchOrganizations";
import PlaygroundAvatar from "./PlaygroundAvatar";

/** Top-bar workspace switcher — shows the active org and lets you jump to another. */
export default function PlaygroundOrgSwitcher() {
    const router = useRouter();
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const { data: organizations } = useFetchOrganizations();

    const slug = typeof orgSlug === "string" ? orgSlug : "";
    const orgs = organizations ?? [];
    const currentName = orgs.find((o) => o.slug === slug)?.name ?? slug ?? "Workspace";
    const letter = currentName.trim().charAt(0).toUpperCase() || "W";

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    className="flex cursor-pointer items-center gap-2 rounded-md bg-white/5 px-2 py-1.5 outline-none hover:bg-white/10 data-[state=open]:bg-white/10"
                >
                    <PlaygroundAvatar letter={letter} tone="emerald" />
                    <span className="max-w-40 truncate text-[13px] font-medium text-neutral-100">
                        {currentName}
                    </span>
                    <ChevronDown className="size-3.5 text-neutral-500" aria-hidden />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="start"
                    sideOffset={6}
                    className="z-50 max-h-80 w-64 origin-(--radix-dropdown-menu-content-transform-origin) overflow-y-auto rounded-lg border border-neutral-800 bg-charcoal p-1 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                >
                    <DropdownMenu.Label className="px-2 py-1.5 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                        Organizations
                    </DropdownMenu.Label>

                    {orgs.length === 0 ? (
                        <div className="px-2 py-2 text-[12px] text-neutral-500">
                            No organizations
                        </div>
                    ) : (
                        orgs.map((org) => (
                            <DropdownMenu.Item
                                key={org.id}
                                onSelect={() => router.push(`/playground/${org.slug}`)}
                                className={cn(
                                    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-neutral-300 outline-none select-none",
                                    "data-[highlighted]:bg-white/5 data-[highlighted]:text-neutral-100",
                                )}
                            >
                                <PlaygroundAvatar
                                    letter={org.name.trim().charAt(0).toUpperCase()}
                                    tone="emerald"
                                    size="sm"
                                />
                                <span className="min-w-0 flex-1 truncate">{org.name}</span>
                                {org.slug === slug && (
                                    <Check
                                        className="size-3.5 shrink-0 text-neutral-400"
                                        aria-hidden
                                    />
                                )}
                            </DropdownMenu.Item>
                        ))
                    )}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
