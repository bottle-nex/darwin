"use client";
import { useMemo, useState } from "react";
import { FaMagnifyingGlass, FaPlus } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import OrganizationCard from "@/components/playground/OrganizationCard";
import OrganizationCardSkeleton from "@/components/playground/OrganizationCardSkeleton";
import CreateOrganizationModal from "@/components/playground/CreateOrganizationModal";
import OrganizationsToolbar, {
    type RoleFilter,
} from "@/components/playground/OrganizationsToolbar";
import type { Organization } from "@/types/organization";
import { useFetchOrganizations } from "@/hooks/playground/useFetchOrganizations";

function filterOrganizations(
    organizations: Organization[],
    search: string,
    role: RoleFilter,
): Organization[] {
    const query = search.trim().toLowerCase();

    return organizations.filter((org) => {
        const matchesQuery =
            !query ||
            org.name.toLowerCase().includes(query) ||
            org.slug.toLowerCase().includes(query);
        const matchesRole = role === "All" || org.role === role;
        return matchesQuery && matchesRole;
    });
}

export default function Playground() {
    const { isPending, isError, data: organizations } = useFetchOrganizations();
    const [search, setSearch] = useState("");
    const [role, setRole] = useState<RoleFilter>("All");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const visible = useMemo(
        () => filterOrganizations(organizations ?? [], search, role),
        [organizations, search, role],
    );

    const isEmpty = !organizations?.length;

    return (
        <main className="h-dvh overflow-y-auto bg-charcoal px-6 py-8 text-neutral-100 sm:px-10">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                {!isEmpty && (
                    <OrganizationsToolbar
                        search={search}
                        onSearch={setSearch}
                        role={role}
                        onRole={setRole}
                        onCreate={() => setIsCreateOpen(true)}
                    />
                )}

                {isPending ? (
                    <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <OrganizationCardSkeleton key={i} />
                        ))}
                    </div>
                ) : isError ? (
                    <p className="text-sm text-red-400">Failed to load organizations.</p>
                ) : isEmpty ? (
                    <div className="flex h-[90vh] flex-col items-center justify-center gap-4 text-center">
                        <span className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                            <FaPlus className="size-5 text-neutral-500" />
                        </span>
                        <div>
                            <p className="text-sm font-medium text-neutral-200">
                                No organizations yet
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                                Create one to start filing issues for your agents.
                            </p>
                        </div>
                        <Button variant="secondary" onClick={() => setIsCreateOpen(true)}>
                            <FaPlus className="size-3" />
                            Create organization
                        </Button>
                    </div>
                ) : visible.length === 0 ? (
                    <div className="flex h-[90vh] flex-col items-center justify-center gap-3 text-center">
                        <span className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                            <FaMagnifyingGlass className="size-5 text-neutral-500" />
                        </span>
                        <div>
                            <p className="text-sm font-medium text-neutral-200">
                                No organizations match
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                                Try a different search or clear the filters.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                        {visible.map((org, i) => (
                            <OrganizationCard key={org.id} organization={org} index={i} />
                        ))}
                    </div>
                )}
            </div>

            <CreateOrganizationModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </main>
    );
}
