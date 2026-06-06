"use client";
import { Users } from "lucide-react";
import { useGetTeamMembers } from "@/hooks/team/useGetTeamMembers";
import PlaygroundTeamMemberRow from "./PlaygroundTeamMemberRow";

export default function PlaygroundTeamMembers({ teamId }: { teamId: string }) {
    const { data, isLoading, isError } = useGetTeamMembers(teamId);
    const members = data?.members;

    return (
        <section className="rounded-xl ring-1 ring-white/5 bg-charcoal p-3">
            <div className="mb-2 flex items-center gap-2 px-1">
                <Users className="size-4 text-neutral-400" aria-hidden />
                <h3 className="text-[15px] font-medium text-neutral-100">Current Members</h3>
                <span className="text-[13px] text-neutral-500">({members?.length ?? 0})</span>
            </div>

            <div className="mt-5 flex flex-col gap-2.25">
                {isLoading ? (
                    [0, 1, 2].map((i) => (
                        <div key={i} className="h-[58px] animate-pulse rounded-lg bg-white/5" />
                    ))
                ) : isError ? (
                    <p className="px-1 py-2 text-[12px] text-red-400">
                        Couldn&apos;t load members.
                    </p>
                ) : !members?.length ? (
                    <p className="px-1 py-2 text-[12px] text-neutral-500">No members yet.</p>
                ) : (
                    members.map((member) => (
                        <PlaygroundTeamMemberRow key={member.id} member={member} />
                    ))
                )}
            </div>
        </section>
    );
}
