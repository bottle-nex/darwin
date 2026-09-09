"use client";
import { AddIcon, DeleteIcon, TeamEntityIcon } from "@trydarwin/ui/icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { IconPickButton } from "@/components/ui/IconPicker";
import { useUpdateTeam } from "@/hooks/team/useUpdateTeam";
import { useDeleteTeamStore } from "@/store/team/useDeleteTeamStore";
import { useNewTeamStore } from "@/store/team/useNewTeamStore";
import type { ProjectDetail, ProjectTeam } from "@/types/project";

function TeamRow({
    team,
    projectId,
    canManage,
    onDelete,
}: {
    team: ProjectTeam;
    projectId: string;
    canManage: boolean;
    onDelete: () => void;
}) {
    const [open, setOpen] = useState(false);
    const updateTeam = useUpdateTeam();

    return (
        <div className="surface-card group flex items-center gap-3 rounded-lg px-3 py-2">
            <IconPickButton
                pick={team.icon}
                onSelect={(icon) => updateTeam.mutate({ teamId: team.id, projectId, icon })}
                open={open}
                onOpenChange={setOpen}
                label={`Pick ${team.name} icon`}
                size="sm"
                fallbackIcon={TeamEntityIcon}
            />
            <span className="min-w-0 flex-1 truncate text-[12px] text-neutral-200">
                {team.name}
            </span>
            {canManage && (
                <Button
                    variant="unstyled"
                    type="button"
                    aria-label={`Delete ${team.name}`}
                    onClick={onDelete}
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-neutral-400 hover:bg-overlay/10 hover:text-danger"
                >
                    <DeleteIcon className="size-3" aria-hidden />
                </Button>
            )}
        </div>
    );
}

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
                        <AddIcon className="size-3" aria-hidden />
                        Add team
                    </Button>
                )}
            </div>

            {project.teams.length === 0 ? (
                <p className="surface-sunken rounded-lg px-3 py-6 text-center text-[12px] text-neutral-500">
                    No teams yet.
                </p>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {project.teams.map((t) => (
                        <TeamRow
                            key={t.id}
                            team={t}
                            projectId={project.id}
                            canManage={canManage}
                            onDelete={() => requestDelete(t)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
