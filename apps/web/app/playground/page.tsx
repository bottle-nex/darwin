"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";

import LogoLoader from "@/components/app/LogoLoader";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useFetchOrganizations } from "@/hooks/playground/useFetchOrganizations";
import { useLastVisited } from "@/hooks/user/useLastVisited";

function PlaygroundResolver() {
    const router = useRouter();
    const searchParams = useSearchParams();

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
        if (noOrgs) {
            router.replace("/workspace");
        } else if (readyToRedirect) {
            router.replace(`/playground/${resolvedOrgSlug}/${targetProjectSlug}`);
        } else if (noProjects) {
            router.replace(`/playground/${resolvedOrgSlug}`);
        }
    }, [noOrgs, readyToRedirect, noProjects, resolvedOrgSlug, targetProjectSlug, router]);

    const loading =
        orgsPending ||
        lastVisitedPending ||
        (!!resolvedOrgSlug && dashboardPending) ||
        readyToRedirect ||
        noProjects ||
        noOrgs;

    return (
        <main className="flex h-dvh items-center justify-center bg-ink px-6 text-neutral-100">
            {loading ? <LogoLoader /> : null}
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
