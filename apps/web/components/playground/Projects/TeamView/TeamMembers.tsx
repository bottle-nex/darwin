"use client";
import React, { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { IoPersonAddOutline } from "react-icons/io5";
import { Users } from "lucide-react";
import { useGetTeamMembers } from "@/hooks/team/useGetTeamMembers";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import useInviteTeamMember from "@/hooks/invitations/useInviteTeamMember";
import InviteToTeamDialog from "@/components/team/InviteToTeamDialog";
import PlaygroundTeamMemberRow from "./TeamMemberRow";
import { StatType } from "./TeamStats";
import { TeamMembersData } from "@/types/team";
import { TeamRole } from "@trymatcha/types";
import ProfileCard from "@/components/utility/ProfileCard";

export default function PlaygroundTeamMembers({
    teamId,
    teamName,
    currentStat,
}: {
    teamId: string;
    teamName: string;
    currentStat: StatType;
}) {
    const { data, isLoading, isError } = useGetTeamMembers(teamId);
    const members = data?.members;
    const isAdmin = data?.viewerRole === "Admin";

    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = dashboard?.projects.find((p) => p.slug === projectSlug);
    const user = useUserSessionStore((s) => s.session?.user);

    const [inviteOpen, setInviteOpen] = useState<boolean>(false);
    const invite = useInviteTeamMember();

    return (
        <section className="rounded-xl ring-1 ring-white/5 bg-charcoal p-3">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                    <Users className="size-4 text-neutral-400" aria-hidden />
                    <h3 className="text-[15px] font-medium text-neutral-100">Current Members</h3>
                    <span className="text-[13px] text-neutral-500">({members?.length ?? 0})</span>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setInviteOpen(true)}
                        className="bg-neutral-100 text-neutral-800 h-7 w-fit rounded-sm px-2 text-[12px] font-medium flex items-center gap-x-1 tracking-tight cursor-pointer"
                    >
                        <IoPersonAddOutline className="" strokeWidth="3" />
                        Invite members
                    </button>
                )}
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
                    <RenderMembers membersData={data} currentStat={currentStat} teamId={teamId} orgId={dashboard?.org.id ?? ""} />
                )}
            </div>

            <InviteToTeamDialog
                open={inviteOpen}
                onOpenChange={setInviteOpen}
                sender={{ name: user?.name, email: user?.email, image: user?.image }}
                orgName={dashboard?.org.name ?? ""}
                projectName={activeProject?.name ?? ""}
                teamName={teamName}
                onSubmit={({ emails, message }) => {
                    if (!dashboard?.org.id || !activeProject?.id) return;
                    invite.mutate(
                        {
                            emails,
                            message,
                            orgId: dashboard.org.id,
                            projectId: activeProject.id,
                            teamId,
                        },
                        {
                            onSuccess: ({ invited, failed }) => {
                                if (invited.length) {
                                    toast.success(
                                        `Invited ${invited.length} ${invited.length === 1 ? "person" : "people"
                                        }`,
                                    );
                                }
                                if (failed.length) {
                                    toast.warning(
                                        `Skipped ${failed.length}: ${failed
                                            .map(
                                                (f) =>
                                                    `${f.email} (${f.reason.replace(/_/g, " ")})`,
                                            )
                                            .join(", ")}`,
                                    );
                                }
                                if (!invited.length && !failed.length) {
                                    toast.info("No invitations were sent");
                                }
                                setInviteOpen(false);
                            },
                            onError: () => toast.error("Couldn't send invites. Please try again."),
                        },
                    );
                }}
                isPending={invite.isPending}
            />
        </section>
    );
}

function RenderMembers({
    membersData,
    currentStat,
    teamId,
    orgId,
}: {
    membersData: NoInfer<TeamMembersData> | undefined;
    currentStat: StatType;
    teamId: string;
    orgId: string;
}) {
    function renderRows() {
        switch (currentStat) {
            case StatType.Total:
                return membersData?.members.map((member) => (
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
                ));
            case StatType.Maintainers:
                return membersData?.members
                    .filter((m) => m.role === TeamRole.Maintainer)
                    .map((member) => (
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
                    ));
            case StatType.Members:
                return membersData?.members
                    .filter((m) => m.role === TeamRole.Member)
                    .map((member) => (
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
                    ));
            case StatType.Pending:
                return membersData?.pendingInvites.map((member) => (
                    <HoverRow
                        key={member.id}
                        card={
                            <ProfileCard
                                id={member.id}
                                name={member.user.email}
                                role="Pending"
                                profilimage=""
                                teamId={teamId}
                                orgId={orgId}
                            />
                        }
                    >
                        <PlaygroundTeamMemberRow pendingMember={member} />
                    </HoverRow>
                ));
            default:
                return null;
        }
    }

    return <div>{renderRows()}</div>;
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
