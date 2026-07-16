"use client";
import { useGetTeamMembers } from "@/hooks/team/useGetTeamMembers";
import LogoLoader from "@/components/app/LogoLoader";
import PlaygroundTeamMemberRow from "./TeamMemberRow";
import { TeamMembersData } from "@/types/team";

export default function PlaygroundTeamMembers({ teamId }: { teamId: string }) {
    const { data, isLoading, isError } = useGetTeamMembers(teamId);
    const members = data?.members;

    return (
        <section
            data-lenis-prevent
            className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-2"
        >
            {/* Table header */}
            <div className="grid shrink-0 grid-cols-[1fr_120px_140px] items-center gap-4 px-2.5 pb-2 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                <span>Name</span>
                <span className="ml-1">Role</span>
                <span>Joined</span>
            </div>

            {/* Table body */}
            <div className="flex flex-col gap-0.5 pt-1.5">
                {isLoading ? (
                    <LogoLoader size={32} className="py-16" />
                ) : isError ? (
                    <p className="px-2.5 py-3 text-[12px] text-red-400">
                        Couldn&apos;t load members.
                    </p>
                ) : !members?.length ? (
                    <p className="px-2.5 py-3 text-[12px] text-neutral-500">No members yet.</p>
                ) : (
                    <RenderMembers membersData={data} teamId={teamId} />
                )}
            </div>
        </section>
    );
}

function RenderMembers({
    membersData,
    teamId,
}: {
    membersData: NoInfer<TeamMembersData> | undefined;
    teamId: string;
}) {
    return (
        <>
            {membersData?.members.map((member) => (
                <PlaygroundTeamMemberRow teamMember={member} teamId={teamId} key={member.id} />
            ))}

            {membersData?.pendingInvites.map((invite) => (
                <PlaygroundTeamMemberRow pendingMember={invite} teamId={teamId} key={invite.id} />
            ))}
        </>
    );
}
