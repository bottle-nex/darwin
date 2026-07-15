"use client";
import { useParams } from "next/navigation";
import PlaygroundTopBar from "@/components/playground/Core/TopBar/PlaygroundTopBar";
import PlaygroundSidebar from "@/components/playground/Sidebar/PlaygroundSidebar";
import PlaygroundDisplay from "@/components/playground/Core/PlaygroundDisplay";
import CreateTeamDialog from "@/components/team/CreateTeamDialog";
import DeleteTeamDialog from "@/components/team/DeleteTeamDialog";
import CreateOrEditIssueDialog from "@/components/playground/Home/KanbanDisplay/Issue/CreateOrEditIssueDialog";
import { useIssueDialog } from "@/components/playground/issue/useIssueDialog";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetProject } from "@/hooks/project/useGetProject";
import { usePlaygroundUrlSync } from "./usePlaygroundUrlSync";
import { useSubscribeEventHandlers } from "@/hooks/socket/useSubscribeEventHandlers";
import usePlaygroundShortcuts from "@/hooks/shortcuts/usePlaygroundShortcuts";

/**
 * Shared playground workspace shell rendered by both the org route
 * (`/playground/[orgSlug]`) and the project route
 * (`/playground/[orgSlug]/[projectSlug]`). When a project slug is present it
 * resolves it to an id via the org's dashboard and fetches that project's
 * detail (teams, etc.) so it is warm in the query cache for the workspace.
 */
export default function PlaygroundShell() {
    const { orgSlug, projectSlug } = useParams<{
        orgSlug: string;
        projectSlug?: string;
    }>();

    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = projectSlug
        ? dashboard?.projects.find((p) => p.slug === projectSlug)
        : undefined;
    const { data: project } = useGetProject(activeProject?.id);

    // open one realtime connection for the active project and
    // register the inbound handlers.
    useSubscribeEventHandlers(activeProject?.id);

    // Keep the active surface/tab (and open team) in the URL so a refresh restores it.
    usePlaygroundUrlSync(project?.teams);
    // Open the issue dialog for a deep-linked `…/issue/<id>` and follow Back/Forward.
    useIssueDialog({ sync: true });
    // Global keyboard shortcuts (e.g. `o` then `t` to open Tags).
    usePlaygroundShortcuts();

    return (
        <main className="flex h-screen flex-col overflow-hidden text-neutral-100 pt-px select-none">
            <PlaygroundTopBar />
            <section className="flex flex-1 min-h-0 gap-2 p-2 pt-px">
                <PlaygroundSidebar />
                <PlaygroundDisplay />
            </section>
            <CreateTeamDialog />
            <DeleteTeamDialog />
            <CreateOrEditIssueDialog />
        </main>
    );
}
