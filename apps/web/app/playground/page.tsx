"use client";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoAddSharp } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OrgList from "@/components/playground/landing/OrgList";
import CreateOrganizationModal from "@/components/playground/landing/CreateOrganizationModal";
import ProjectCard from "@/components/project/ProjectCard";
import CreateProjectDialog from "@/components/project/CreateProjectDialog";
import LogoLoader from "@/components/app/LogoLoader";
import NoResource from "@/components/utility/NoResource";
import ProjectsGlyph from "@/components/utility/ProjectsGlyph";
import NoOrganization from "@/components/playground/root/NoOrganization";
import { useFetchOrganizations } from "@/hooks/playground/useFetchOrganizations";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useNewProjectStore } from "@/store/project/useNewProjectStore";
import PlaygroundUserMenu from "@/components/playground/Core/TopBar/PlaygroundUserMenu";

const FIELD =
    "border-white/10 bg-white/5 text-[13px] text-neutral-300 hover:bg-white/7 focus-visible:border-[#9bc24f] focus-visible:ring-[#9bc24f]/30";

function PlaygroundLanding() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const {
        isPending: orgsPending,
        isError: orgsError,
        data: organizations,
    } = useFetchOrganizations();
    const { setOpen, setTargetOrgSlug } = useNewProjectStore();

    const orgs = organizations ?? [];
    const orgParam = searchParams.get("org") ?? "";
    const [selected, setSelected] = useState(orgParam);
    const selectedSlug = orgs.some((o) => o.slug === selected) ? selected : (orgs[0]?.slug ?? "");

    const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState("");

    const {
        isPending: projectsPending,
        isError: projectsError,
        data: dashboard,
    } = useGetDashboard(selectedSlug || undefined);

    const visibleProjects = useMemo(() => {
        const all = dashboard?.projects ?? [];
        const q = projectSearch.trim().toLowerCase();
        if (!q) return all;
        return all.filter(
            (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
        );
    }, [dashboard, projectSearch]);

    function selectOrg(slug: string) {
        setSelected(slug);
        setProjectSearch("");
        router.replace(`/playground?org=${slug}`);
    }

    function openCreateProject() {
        if (!selectedSlug) return;
        setTargetOrgSlug(selectedSlug);
        setOpen(true);
    }

    const noOrgs = !orgsPending && !orgsError && orgs.length === 0;

    return (
        <main className="h-dvh overflow-y-auto bg-charcoal px-6 text-neutral-100 sm:px-10">
            <div className="mx-auto flex flex-col gap-6 lg:min-h-[calc(100dvh-4rem)] lg:flex-row lg:gap-8 h-full">
                <OrgList
                    orgs={orgs}
                    selectedSlug={selectedSlug}
                    onSelect={selectOrg}
                    onCreateOrg={() => setIsCreateOrgOpen(true)}
                />

                <div className="hidden w-px self-stretch bg-white/10 lg:block" />

                <section className="flex min-w-0 flex-1 flex-col gap-5 py-8">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:max-w-xs">
                            <FaMagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-neutral-500" />
                            <Input
                                value={projectSearch}
                                onChange={(e) => setProjectSearch(e.target.value)}
                                placeholder="Search projects…"
                                disabled={noOrgs}
                                className={`pl-9 placeholder:text-neutral-500 ${FIELD}`}
                            />
                        </div>
                        <div className="gap-x-3 flex items-center justify-center">
                            <Button onClick={openCreateProject} disabled={!selectedSlug}>
                                <IoAddSharp className="size-3" />
                                Create Project
                            </Button>
                            <PlaygroundUserMenu />
                        </div>
                    </div>

                    {noOrgs ? (
                        <NoOrganization onCreateOrg={() => setIsCreateOrgOpen(true)} />
                    ) : (
                        <>
                            {projectsPending ? (
                                <LogoLoader className="py-24" />
                            ) : projectsError ? (
                                <p className="text-sm text-red-400">Failed to load projects.</p>
                            ) : (dashboard?.projects.length ?? 0) === 0 ? (
                                <NoResource
                                    className="pl-[8%] sm:pl-[14%] lg:pl-[20%] mt-12"
                                    icon={<ProjectsGlyph className="size-24" />}
                                    title="Projects"
                                    description="A project groups the issues your team files onto a shared board. An agent picks them up, implements the fix, runs tests, and opens a pull request for review. Create one to start filing issues."
                                    action={{
                                        label: "Create new project",
                                        onClick: openCreateProject,
                                        disabled: !selectedSlug,
                                    }}
                                />
                            ) : visibleProjects.length === 0 ? (
                                <div className="flex h-[70vh] flex-col items-center justify-center gap-3 text-center">
                                    <span className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                                        <FaMagnifyingGlass className="size-5 text-neutral-500" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-200">
                                            No projects match
                                        </p>
                                        <p className="mt-1 text-xs text-neutral-500">
                                            Try a different search.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 xl:grid-cols-3">
                                    {visibleProjects.map((project) => (
                                        <ProjectCard
                                            key={project.id}
                                            project={project}
                                            orgSlug={selectedSlug}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>

            <CreateOrganizationModal open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen} />
            <CreateProjectDialog />
        </main>
    );
}

export default function Playground() {
    return (
        <Suspense fallback={<div className="h-dvh bg-charcoal" />}>
            <PlaygroundLanding />
        </Suspense>
    );
}
