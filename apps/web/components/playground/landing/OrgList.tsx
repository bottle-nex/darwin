"use client";
import { useMemo, useState } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoAddSharp } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Organization } from "@/types/organization";
import OrgListItem from "./OrgListItem";

const FIELD =
    "border-white/10 bg-white/5 text-[13px] text-neutral-300 hover:bg-white/7 focus-visible:border-[#9bc24f] focus-visible:ring-[#9bc24f]/30";

export default function OrgList({
    orgs,
    selectedSlug,
    onSelect,
    onCreateOrg,
}: {
    orgs: Organization[];
    selectedSlug: string;
    onSelect: (slug: string) => void;
    onCreateOrg: () => void;
}) {
    const [search, setSearch] = useState("");

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return orgs;
        return orgs.filter(
            (o) => o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q),
        );
    }, [orgs, search]);

    return (
        <aside className="flex min-h-0 w-full shrink-0 flex-col gap-3 sm:w-64 py-8">
            <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold">Organizations</h2>
                <Button variant="tertiary" onClick={onCreateOrg}>
                    <IoAddSharp className="size-3 text-charcoal!" />
                    create org
                </Button>
            </div>

            <div className="relative">
                <FaMagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-3 -translate-y-1/2 text-neutral-500" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search organizations…"
                    className={`h-8 pl-8 text-[12px] placeholder:text-neutral-500 ${FIELD}`}
                />
            </div>

            <div
                data-lenis-prevent
                className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto"
            >
                {visible.length === 0 ? (
                    <p className="px-2.5 py-2 text-[12px] text-neutral-500">
                        {orgs.length === 0 ? "No organizations yet." : "No organizations match."}
                    </p>
                ) : (
                    visible.map((org) => (
                        <OrgListItem
                            key={org.id}
                            org={org}
                            selected={org.slug === selectedSlug}
                            onSelect={() => onSelect(org.slug)}
                        />
                    ))
                )}
            </div>
        </aside>
    );
}
