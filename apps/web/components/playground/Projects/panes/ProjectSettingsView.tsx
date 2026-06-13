"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { ArrowLeft, KeyRound, Lock, Pencil, Plus, Trash2, Users, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useUpdateProject } from "@/hooks/project/useUpdateProject";
import { useDeleteProject } from "@/hooks/project/useDeleteProject";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { useNewTeamStore } from "@/store/team/useNewTeamStore";
import { useDeleteTeamStore } from "@/store/team/useDeleteTeamStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../IconRail/railSurface";
import { ProjectsTab } from "../projectsTabs";
import type { ProjectDetail } from "@/types/project";
import ProjectEnvSettings from "./settings/ProjectEnvSettings";

type Section = "project" | "teams" | "members" | "env";

const FIELD =
    "border-white/10 bg-white/5 text-neutral-200 placeholder:text-neutral-500 focus-visible:border-[#9bc24f] focus-visible:ring-[#9bc24f]/30";

export default function ProjectSettingsView() {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = projectSlug
        ? dashboard?.projects.find((p) => p.slug === projectSlug)
        : undefined;
    const projectId = activeProject?.id;

    const { data: project } = useGetProject(projectId);
    const canManage = project?.viewerRole === "Admin" || project?.viewerRole === "Maintain";
    const isAdmin = project?.viewerRole === "Admin";

    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const [section, setSection] = useState<Section>("project");

    const NAV: { id: Section; label: string; icon: typeof Pencil }[] = [
        { id: "project", label: "Project", icon: Pencil },
        { id: "teams", label: "Teams", icon: UsersRound },
        { id: "members", label: "Members", icon: Users },
        { id: "env", label: "Environment variables", icon: KeyRound },
    ];

    if (!project) {
        return <div className="flex-1" />;
    }

    if (!canManage) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-charcoal text-neutral-300 ring-1 ring-white/10">
                    <Lock className="size-5" aria-hidden />
                </span>
                <h2 className="mt-4 text-[13px] font-semibold text-neutral-100">
                    Settings are restricted
                </h2>
                <p className="mt-1 max-w-sm text-[12px] text-neutral-500">
                    You need Admin or Maintain access on this project to manage its settings.
                </p>
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1">
            {/* Left panel */}
            <nav className="w-52 shrink-0 border-r border-white/5 p-2.5">
                <button
                    type="button"
                    onClick={() => setTab(RailSurface.Projects, ProjectsTab.Overview)}
                    className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
                >
                    <ArrowLeft className="size-3 shrink-0" aria-hidden />
                    <span className="truncate">Back</span>
                </button>
                {NAV.map((item) => {
                    const dividerBefore = item.id === "env";
                    return (
                        <div key={item.id}>
                            {dividerBefore && <div className="my-2 h-px bg-white/5" />}
                            <button
                                type="button"
                                onClick={() => setSection(item.id)}
                                className={cn(
                                    "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px]",
                                    section === item.id
                                        ? "bg-white/10 text-neutral-100"
                                        : "text-neutral-300 hover:bg-white/5 hover:text-neutral-100",
                                )}
                            >
                                <item.icon className="size-3 shrink-0" aria-hidden />
                                <span className="truncate">{item.label}</span>
                            </button>
                        </div>
                    );
                })}
            </nav>

            {/* Content */}
            <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="mx-auto w-full max-w-2xl">
                    {section === "project" && (
                        <ProjectSection
                            key={project.id}
                            project={project}
                            isAdmin={isAdmin}
                            orgSlug={orgSlug ?? ""}
                        />
                    )}
                    {section === "teams" && (
                        <TeamsSection project={project} isAdmin={isAdmin} canManage={canManage} />
                    )}
                    {section === "members" && <MembersSection projectId={projectId} />}
                    {section === "env" && <ProjectEnvSettings projectId={projectId} />}
                </div>
            </div>
        </div>
    );
}

// ── Project (details + delete) ───────────────────────────────────────────────
function ProjectSection({
    project,
    isAdmin,
    orgSlug,
}: {
    project: ProjectDetail;
    isAdmin: boolean;
    orgSlug: string;
}) {
    const router = useRouter();
    const update = useUpdateProject();
    const del = useDeleteProject();
    const [name, setName] = useState(project.name);
    const [slug, setSlug] = useState(project.slug);
    const [description, setDescription] = useState(project.description ?? "");
    const [confirmOpen, setConfirmOpen] = useState(false);

    const dirty =
        name.trim() !== project.name ||
        slug.trim() !== project.slug ||
        description.trim() !== (project.description ?? "");
    const canSave = name.trim().length > 0 && slug.trim().length > 0 && dirty && !update.isPending;

    const slugTaken =
        isAxiosError(update.error) && update.error.response?.data?.error?.code === "SLUG_TAKEN";

    function save() {
        if (!canSave) return;
        update.mutate({
            project_id: project.id,
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim(),
        });
    }

    function remove() {
        del.mutate(project.id, {
            onSuccess: () => router.push(`/playground/${orgSlug}`),
        });
    }

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-[13px] font-semibold text-neutral-100">Project</h2>
                <p className="mt-1 text-[12px] text-neutral-500">
                    Change the name, slug, or description.
                </p>
            </div>

            <div>
                <label className="text-[11px] text-neutral-400">Name</label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn(FIELD, "mt-1.5 h-9 text-[13px]")}
                />
            </div>

            <div>
                <label className="text-[11px] text-neutral-400">Slug</label>
                <Input
                    value={slug}
                    onChange={(e) =>
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                    className={cn(FIELD, "mt-1.5 h-9 font-mono text-[13px]")}
                />
                {slugTaken && (
                    <p className="mt-1.5 text-[11px] text-red-400">That slug is already taken.</p>
                )}
            </div>

            <div>
                <label className="text-[11px] text-neutral-400">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={150}
                    rows={3}
                    className={cn(
                        "mt-1.5 w-full resize-none rounded-lg bg-white/5 px-3 py-2 text-[13px] text-neutral-200 shadow-[inset_0_1px_0_0_#262626] outline-none placeholder:text-neutral-500 focus-visible:ring-[3px] focus-visible:ring-[#9bc24f]/30",
                    )}
                />
            </div>

            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    size="sm"
                    loading={update.isPending}
                    disabled={!canSave}
                    onClick={save}
                >
                    Save changes
                </Button>
                {update.isSuccess && !dirty && (
                    <span className="text-[11px] text-[#9bc24f]">Saved</span>
                )}
                {isAdmin && (
                    <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="ml-auto"
                        onClick={() => setConfirmOpen(true)}
                    >
                        <Trash2 className="size-3" aria-hidden />
                        Delete project
                    </Button>
                )}
            </div>

            <Dialog open={confirmOpen} onOpenChange={(o) => !del.isPending && setConfirmOpen(o)}>
                <DialogContent className="border-white/10 bg-charcoal sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[14px] text-neutral-100">
                            Delete project?
                        </DialogTitle>
                        <DialogDescription className="text-[12px] text-neutral-500">
                            This permanently deletes{" "}
                            <span className="text-neutral-300">{project.name}</span> and everything
                            in it, teams, issues, and secrets. This can&rsquo;t be reverted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            size="sm"
                            variant="tertiary"
                            disabled={del.isPending}
                            onClick={() => setConfirmOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            loading={del.isPending}
                            onClick={remove}
                        >
                            Delete project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── Teams ──────────────────────────────────────────────────────────────────
function TeamsSection({
    project,
    isAdmin,
    canManage,
}: {
    project: ProjectDetail;
    isAdmin: boolean;
    canManage: boolean;
}) {
    const { setOpen, setTargetProjectId } = useNewTeamStore();
    const requestDelete = useDeleteTeamStore((s) => s.requestDelete);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-[13px] font-semibold text-neutral-100">Teams</h2>
                    <p className="mt-1 text-[12px] text-neutral-500">
                        Teams scope who can access this project and at what role.
                    </p>
                </div>
                {isAdmin && (
                    <Button
                        type="button"
                        size="sm"
                        variant="tertiary"
                        onClick={() => {
                            setTargetProjectId(project.id);
                            setOpen(true);
                        }}
                    >
                        <Plus className="size-3" aria-hidden />
                        Add team
                    </Button>
                )}
            </div>

            {project.teams.length === 0 ? (
                <p className="rounded-lg bg-white/5 px-3 py-6 text-center text-[12px] text-neutral-500 shadow-[inset_0_1px_0_0_#262626]">
                    No teams yet.
                </p>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {project.teams.map((t) => (
                        <div
                            key={t.id}
                            className="group flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 shadow-[inset_0_1px_0_0_#262626]"
                        >
                            <PlaygroundAvatar
                                letter={t.name.trim().charAt(0).toUpperCase()}
                                tone="indigo"
                                size="sm"
                            />
                            <span className="min-w-0 flex-1 truncate text-[12px] text-neutral-200">
                                {t.name}
                            </span>
                            <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-neutral-400">
                                {t.projectRole}
                            </span>
                            {canManage && (
                                <button
                                    type="button"
                                    aria-label={`Delete ${t.name}`}
                                    onClick={() => requestDelete(t)}
                                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-neutral-400 hover:bg-neutral-700/50 hover:text-red-500"
                                >
                                    <Trash2 className="size-3" aria-hidden />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Members ──────────────────────────────────────────────────────────────────
function MembersSection({ projectId }: { projectId: string | undefined }) {
    const members = useProjectMembers(projectId);
    const list = members.data ?? [];

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-[13px] font-semibold text-neutral-100">Members</h2>
                <p className="mt-1 text-[12px] text-neutral-500">
                    Everyone with access to this project, across all of its teams.
                </p>
            </div>

            {members.isLoading ? (
                <p className="px-1 py-3 text-[12px] text-neutral-500">Loading…</p>
            ) : list.length === 0 ? (
                <p className="rounded-lg bg-white/5 px-3 py-6 text-center text-[12px] text-neutral-500 shadow-[inset_0_1px_0_0_#262626]">
                    No members yet.
                </p>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {list.map((m) => (
                        <div
                            key={m.id}
                            className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 shadow-[inset_0_1px_0_0_#262626]"
                        >
                            <PlaygroundAvatar
                                letter={(m.name ?? m.email).trim().charAt(0).toUpperCase()}
                                tone="purple"
                                size="sm"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[12px] text-neutral-200">
                                    {m.name ?? m.email}
                                </div>
                                {m.name && (
                                    <div className="truncate text-[10px] text-neutral-500">
                                        {m.email}
                                    </div>
                                )}
                            </div>
                            <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-neutral-400">
                                {m.role}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
