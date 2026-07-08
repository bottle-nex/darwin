"use client";
import React, { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useGetTeamMembers } from "@/hooks/team/useGetTeamMembers";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import PlaygroundTeamMemberRow from "./TeamMemberRow";
import { TeamMembersData } from "@/types/team";
import ProfileCard from "@/components/utility/ProfileCard";

export default function PlaygroundTeamMembers({ teamId }: { teamId: string }) {
    const { data, isLoading, isError } = useGetTeamMembers(teamId);
    const members = data?.members;

    const { orgSlug } = useParams<{ orgSlug: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);

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
                    [0, 1, 2].map((i) => (
                        <div key={i} className="h-12 animate-pulse rounded-md bg-white/5" />
                    ))
                ) : isError ? (
                    <p className="px-2.5 py-3 text-[12px] text-red-400">
                        Couldn&apos;t load members.
                    </p>
                ) : !members?.length ? (
                    <p className="px-2.5 py-3 text-[12px] text-neutral-500">No members yet.</p>
                ) : (
                    <RenderMembers
                        membersData={data}
                        teamId={teamId}
                        orgId={dashboard?.org.id ?? ""}
                    />
                )}
            </div>
        </section>
    );
}

function RenderMembers({
    membersData,
    teamId,
    orgId,
}: {
    membersData: NoInfer<TeamMembersData> | undefined;
    teamId: string;
    orgId: string;
}) {
    return (
        <>
            {membersData?.members.map((member) => (
                <HoverRow
                    key={member.id}
                    card={
                        <ProfileCard
                            id={member.id}
                            name={member.user.name ?? member.user.email}
                            role={member.role}
                            profilimage={member.user.image ?? ""}
                            teamId={teamId}
                            orgId={orgId}
                        />
                    }
                >
                    <PlaygroundTeamMemberRow teamMember={member} />
                </HoverRow>
            ))}

            {membersData?.pendingInvites.map((invite) => (
                <HoverRow
                    key={invite.id}
                    card={
                        <ProfileCard
                            id={invite.id}
                            name={invite.user.email}
                            role="Pending"
                            profilimage=""
                            teamId={teamId}
                            orgId={orgId}
                        />
                    }
                >
                    <PlaygroundTeamMemberRow pendingMember={invite} />
                </HoverRow>
            ))}
        </>
    );
}

function HoverRow({ card, children }: { card: React.ReactNode; children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const locked = useRef(false);

    const show = (e: React.MouseEvent) => {
        if (timer.current) clearTimeout(timer.current);
        if (!locked.current) {
            setPos({ x: e.clientX, y: e.clientY });
            locked.current = true;
        }
        setVisible(true);
    };

    const hide = () => {
        timer.current = setTimeout(() => {
            setVisible(false);
            locked.current = false;
        }, 200);
    };

    const cancelHide = () => {
        if (timer.current) clearTimeout(timer.current);
    };

    const CARD_W = 300;
    const CARD_H = 296; // h-74 = 18.5rem at 16px base
    const leftPos = Math.min(pos.x - 59, window.innerWidth - CARD_W - 8);
    const topPos = Math.min(pos.y - 55, window.innerHeight - CARD_H - 8);

    return (
        <div onMouseEnter={show} onMouseLeave={hide}>
            {children}
            {visible && (
                <div
                    className="fixed z-50"
                    style={{ top: topPos, left: leftPos }}
                    onMouseEnter={cancelHide}
                    onMouseLeave={hide}
                >
                    {card}
                </div>
            )}
        </div>
    );
}
