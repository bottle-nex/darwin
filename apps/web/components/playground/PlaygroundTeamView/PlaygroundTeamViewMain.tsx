"use client";
import { Trash2, X } from "lucide-react";
import type { ProjectTeam } from "@/types/project";
import { useDeleteTeamStore } from "@/store/team/useDeleteTeamStore";
import PlaygroundAvatar from "../PlaygroundAvatar";
import PlaygroundTeamStats from "./PlaygroundTeamStats";
import PlaygroundTeamMembers from "./PlaygroundTeamMembers";

type PlaygroundTeamViewProps = {
    team: ProjectTeam;
    onClose: () => void;
};

export default function PlaygroundTeamViewMain({ team, onClose }: PlaygroundTeamViewProps) {
    const requestDelete = useDeleteTeamStore((s) => s.requestDelete);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
                <div className="flex items-center gap-2.5">
                    <PlaygroundAvatar
                        size="xl"
                        letter={team.name.trim().charAt(0).toUpperCase()}
                        tone="indigo"
                    />
                    <div>
                        <h2 className="text-[14px] font-semibold text-neutral-100">{team.name}</h2>
                        <p className="font-mono text-[11px] text-neutral-500">@{team.slug}</p>
                    </div>
                </div>
                <div className="flex items-center gap-0.5">
                    <button
                        type="button"
                        onClick={() => requestDelete(team)}
                        aria-label="Delete team"
                        className="flex size-7 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-white/5 hover:text-rose-300"
                    >
                        <Trash2 className="size-4" aria-hidden />
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex size-7 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
                    >
                        <X className="size-4" aria-hidden />
                    </button>
                </div>
            </div>

            <div
                data-lenis-prevent
                className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-5"
            >
                <PlaygroundTeamStats teamId={team.id} />
                <PlaygroundTeamMembers teamId={team.id} />
            </div>
        </div>
    );
}
