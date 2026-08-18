"use client";
import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CreateOrganizationForm from "@/components/playground/landing/CreateOrganizationForm";
import LogoLoader from "@/components/app/LogoLoader";
import { useFetchOrganizations } from "@/hooks/playground/useFetchOrganizations";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useLastVisited } from "@/hooks/user/useLastVisited";
import { useNewProjectStore } from "@/store/project/useNewProjectStore";

function PlaygroundResolver() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setOpen, setTargetOrgSlug, setForceCreate } = useNewProjectStore();

    const { isPending: orgsPending, data: organizations } = useFetchOrganizations();
    const { isPending: lastVisitedPending, data: lastVisited } = useLastVisited();

    const orgs = useMemo(() => organizations ?? [], [organizations]);
    const orgParam = searchParams.get("org") ?? "";

    const resolvedOrgSlug = useMemo(() => {
        if (orgParam && orgs.some((o) => o.slug === orgParam)) return orgParam;
        if (lastVisited && orgs.some((o) => o.slug === lastVisited.orgSlug)) {
            return lastVisited.orgSlug;
        }
        return orgs[0]?.slug ?? "";
    }, [orgParam, orgs, lastVisited]);

    const { isPending: dashboardPending, data: dashboard } = useGetDashboard(
        resolvedOrgSlug || undefined,
    );

    const targetProjectSlug = useMemo(() => {
        const projects = dashboard?.projects ?? [];
        if (lastVisited && projects.some((p) => p.slug === lastVisited.projectSlug)) {
            return lastVisited.projectSlug;
        }
        return projects[0]?.slug;
    }, [dashboard, lastVisited]);

    const noOrgs = !orgsPending && orgs.length === 0;
    const noProjects =
        !noOrgs && !!resolvedOrgSlug && !dashboardPending && dashboard?.projects.length === 0;
    const readyToRedirect = !!resolvedOrgSlug && !!targetProjectSlug;

    useEffect(() => {
        if (readyToRedirect) {
            router.replace(`/playground/${resolvedOrgSlug}/${targetProjectSlug}`);
        } else if (noProjects) {
            router.replace(`/playground/${resolvedOrgSlug}`);
        }
    }, [readyToRedirect, noProjects, resolvedOrgSlug, targetProjectSlug, router]);

    const loading =
        orgsPending ||
        lastVisitedPending ||
        (!!resolvedOrgSlug && dashboardPending) ||
        readyToRedirect ||
        noProjects;

    return (
        <main className="flex h-dvh items-center justify-center bg-ink px-6 text-neutral-100">
            {noOrgs ? (
                <div className="w-full max-w-105 rounded-lg border border-white/10 bg-charcoal p-6 shadow-xl">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-neutral-100">
                            Create organization
                        </h2>
                        <p className="mt-1 text-sm text-neutral-500">
                            Organizations group your projects, teams, and the issues your agents
                            pick up.
                        </p>
                    </div>
                    <CreateOrganizationForm
                        onSuccess={(org) => {
                            setTargetOrgSlug(org.slug);
                            setForceCreate(true);
                            setOpen(true);
                            router.replace(`/playground/${org.slug}`);
                        }}
                    />
                </div>
            ) : loading ? (
                <LogoLoader />
            ) : null}
        </main>
    );
}

export default function Playground() {
    return (
        <Suspense fallback={<div className="h-dvh bg-ink" />}>
            <PlaygroundResolver />
        </Suspense>
    );
}
