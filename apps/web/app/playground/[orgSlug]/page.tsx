"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { FaSpinner } from "react-icons/fa6";

import PlaygroundShell from "@/components/playground/Core/PlaygroundShell";
import CreateProjectDialog from "@/components/project/CreateProjectDialog";
import NoResource from "@/components/utility/NoResource";
import ProjectsGlyph from "@/components/utility/ProjectsGlyph";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useNewProjectStore } from "@/store/project/useNewProjectStore";

/**
 * The org-only URL redirects to the org's first project once the dashboard
 * loads. If the org has no projects yet: when `forceCreate` is already set
 * (we just came from creating this org), render the workspace shell with the
 * create-project dialog forced open. Otherwise (reached via the switcher, a
 * bookmark, or a GitHub connect redirect) show a plain, dismissable prompt —
 * landing here incidentally shouldn't ever trap the user.
 */
export default function OrgRedirectPage() {
    const router = useRouter();
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const { data, isPending } = useGetDashboard(orgSlug);
    const { forceCreate, setOpen, setTargetOrgSlug } = useNewProjectStore();

    const hasNoProjects = !!data && data.projects.length === 0;

    useEffect(() => {
        if (!data) return;
        const first = data.projects[0];
        if (first) {
            router.replace(`/playground/${orgSlug}/${first.slug}`);
        }
    }, [data, orgSlug, router]);

    function openCreateProject() {
        setTargetOrgSlug(orgSlug);
        setOpen(true);
    }

    if (hasNoProjects && forceCreate) {
        return <PlaygroundShell />;
    }

    if (hasNoProjects) {
        return (
            <main className="flex h-dvh items-center justify-center bg-ink px-6 text-neutral-100">
                <NoResource
                    className="items-center text-center"
                    icon={<ProjectsGlyph className="size-24" />}
                    title="Projects"
                    description="A project groups the issues your team files onto a shared board. An agent picks them up, implements the fix, runs tests, and opens a pull request for review. Create one to start filing issues."
                    action={{ label: "Create new project", onClick: openCreateProject }}
                />
                <CreateProjectDialog />
            </main>
        );
    }

    return (
        <main className="flex h-dvh items-center justify-center bg-charcoal text-neutral-500">
            {isPending ? <FaSpinner className="size-5 animate-spin" aria-hidden /> : null}
        </main>
    );
}
