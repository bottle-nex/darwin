"use client";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { useNewTeamStore } from "@/store/team/useNewTeamStore";
import { useDeleteTeamStore } from "@/store/team/useDeleteTeamStore";
import type { ProjectDetail } from "@/types/project";

export default function ProjectSettingsTeamSection({
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
