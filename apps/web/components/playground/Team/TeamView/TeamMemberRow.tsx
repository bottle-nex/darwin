"use client";
import { formatDate } from "@/lib/format";
import type { PendingInviteDetail, TeamMemberDetail } from "@/types/team";
import { INVITATION_STATUS } from "@/types/types.invitation";
import PlaygroundAvatar, {
    initialOf,
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import ProjectRoleTicker from "./ProjectRoleTicker";
import useRevokeInvite from "@/hooks/invitations/useRevokeInvite";
import { cn } from "@/lib/utils";
import { DropdownMenu } from "radix-ui";
import { MdJoinLeft, MdPersonRemove } from "react-icons/md";
import { PiDotsThreeOutlineVerticalLight } from "react-icons/pi";

const ITEM =
    "flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-[12.5px] text-neutral-300 outline-none select-none data-highlighted:bg-white/5 data-highlighted:text-neutral-100";

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
        <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger asChild>
                <button
                    disabled={isPending}
                    className="rounded-sm p-0.5 text-neutral-500 outline-none hover:text-neutral-200 disabled:opacity-50"
                    aria-label="Invite actions"
                >
                    <PiDotsThreeOutlineVerticalLight size={16} />
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className="z-50 w-44 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-xl border border-white/10 bg-linear-to-b from-charcoal to-[#101010] p-1 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.07)] ring-1 ring-black/40 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                >
                    <DropdownMenu.Item
                        className={cn(
                            ITEM,
                            "text-neutral-300 data-highlighted:bg-red-500/10 data-highlighted:text-red-300 group",
                        )}
                        onClick={() => revoke(invitationId)}
                    >
                        <MdPersonRemove
                            className="size-4 text-neutral-400 group-hover:text-red-300"
                            aria-hidden
                        />
                        Revoke invite
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
