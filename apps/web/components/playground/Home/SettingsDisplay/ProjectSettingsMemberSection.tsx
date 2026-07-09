"use client";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";

export default function ProjectSettingsMemberSection({
    projectId,
}: {
    projectId: string | undefined;
}) {
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
