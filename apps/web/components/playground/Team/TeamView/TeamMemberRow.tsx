"use client";
import { formatDate } from "@/lib/format";
import type { PendingInviteDetail, TeamMemberDetail } from "@/types/team";
import { INVITATION_STATUS } from "@/types/types.invitation";
import PlaygroundAvatar, {
    initialOf,
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { Button } from "@/components/ui/button";
import ProjectRoleTicker from "./ProjectRoleTicker";
import useRevokeInvite from "@/hooks/invitations/useRevokeInvite";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MdJoinLeft, MdPersonRemove } from "react-icons/md";
import { PiDotsThreeOutlineVerticalLight } from "react-icons/pi";

type MemberDetailProps = { teamId: string } & (
    | {
          teamMember: TeamMemberDetail;
          pendingMember?: never;
      }
    | {
          teamMember?: never;
          pendingMember: PendingInviteDetail;
      }
);

export default function PlaygroundTeamMemberRow({
    teamMember,
    pendingMember,
    teamId,
}: MemberDetailProps) {
    const isMember = !!teamMember;

    const user = isMember
        ? teamMember.user
        : { name: null, email: pendingMember.user.email, image: null };

    const toneKey = isMember ? teamMember.user.id : pendingMember.user.email;

    const name = user.name?.trim() || user.email;
    const secondary = isMember
        ? teamMember.user.email
        : `Invited by ${pendingMember.invitedBy.name ?? pendingMember.invitedBy.email}`;

    const joined = isMember ? teamMember.createdAt : pendingMember.sentAt;

    return (
        <div className="grid grid-cols-[1fr_120px_140px] items-center gap-4 rounded-md px-2.5 py-2 hover:bg-neutral-800/50 cursor-pointer">
            <div className="flex min-w-0 items-center gap-3">
                <PlaygroundAvatar
                    size="lg"
                    className="rounded-full"
                    src={user.image}
                    letter={initialOf(user.name, user.email)}
                    tone={toneFor(toneKey)}
                />
                <div className="min-w-0">
                    <p className="truncate text-[13px] leading-3 font-medium text-neutral-100">
                        {name}
                    </p>
                    <p className="truncate text-[12px] text-neutral-400 font-medium">{secondary}</p>
                </div>
            </div>

            <div className="min-w-0">
                {isMember ? (
                    teamMember.projectRole ? (
                        <ProjectRoleTicker role={teamMember.projectRole} />
                    ) : (
                        <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                            —
                        </span>
                    )
                ) : (
                    <span className="inline-flex gap-x-1.25 max-w-full items-center truncate rounded-[4px] bg-pink-400/10 px-2 py-0.5 text-[11px] font-medium text-pink-300">
                        {pendingMember.status}
                        <MdJoinLeft size={14} />
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between text-[12px] text-neutral-400">
                <span>{formatDate(joined)}</span>
                {!isMember && pendingMember.status === INVITATION_STATUS.PENDING && (
                    <RevokeInviteMenu invitationId={pendingMember.id} teamId={teamId} />
                )}
            </div>
        </div>
    );
}

function RevokeInviteMenu({ invitationId, teamId }: { invitationId: string; teamId: string }) {
    const { mutate: revoke, isPending } = useRevokeInvite(teamId);

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="unstyled"
                    loading={isPending}
                    iconOnly
                    className="rounded-sm p-0.5 text-neutral-500 outline-none hover:text-neutral-200 disabled:opacity-50 [&_svg]:size-4"
                    aria-label="Invite actions"
                >
                    <PiDotsThreeOutlineVerticalLight size={16} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem className={"group"} onClick={() => revoke(invitationId)}>
                    <MdPersonRemove
                        className="size-4 text-neutral-400 group-hover:text-red-300"
                        aria-hidden
                    />
                    Revoke invite
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
