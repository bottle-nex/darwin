"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaSpinner } from "react-icons/fa6";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";

/**
 * The org-only URL is never a destination — the workspace always needs a project
 * slug. Once the org's dashboard loads we redirect to its first project, or back
 * to the playground (with the org preselected) if it has none yet.
 */
export default function OrgRedirectPage() {
    const router = useRouter();
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const { data } = useGetDashboard(orgSlug);

    useEffect(() => {
        if (!data) return;
        const first = data.projects[0];
        if (first) {
            router.replace(`/playground/${orgSlug}/${first.slug}`);
        } else {
            router.replace(`/playground?org=${orgSlug}`);
        }
    }, [data, orgSlug, router]);

    return (
        <main className="flex h-dvh items-center justify-center bg-charcoal text-neutral-500">
            <FaSpinner className="size-5 animate-spin" aria-hidden />
        </main>
    );
}
