"use client";
import {
    InvitationPendingIcon,
    OverflowMenuVerticalIcon,
    RevokeInviteIcon,
} from "@trydarwin/ui/icons";

import PlaygroundAvatar, {
    initialOf,
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import SelectableRow from "@/components/playground/Core/components/SelectableRow";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useRevokeInvite from "@/hooks/invitations/useRevokeInvite";
import { useMemberSelection } from "@/hooks/team/useMemberSelection";
import { formatDate } from "@/lib/format";
import type { PendingInviteDetail, TeamMemberDetail } from "@/types/team";
import { inviteSelectionKey, memberSelectionKey } from "@/types/team";
import { INVITATION_STATUS } from "@/types/types.invitation";

import ProjectRoleTicker from "./ProjectRoleTicker";
import TeamRoleTicker from "./TeamRoleTicker";

type MemberDetailProps = {
    teamId: string;
    joinedAbove?: boolean;
    joinedBelow?: boolean;
} & (
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
    joinedAbove,
    joinedBelow,
}: MemberDetailProps) {
    const isMember = !!teamMember;
    const { selectedIds, isSelected, toggleSelection } = useMemberSelection();

    const selectionKey = isMember
        ? memberSelectionKey(teamMember.user.id)
        : inviteSelectionKey(pendingMember.id);
    const selected = isSelected(selectionKey);

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
        <SelectableRow
            data-member-id={selectionKey}
            selected={selected}
            selectionActive={selectedIds.length > 0}
            joinedAbove={joinedAbove}
            joinedBelow={joinedBelow}
            selectionLabel={selected ? `Deselect ${name}` : `Select ${name}`}
            onToggleSelection={() => toggleSelection(selectionKey)}
            className="cursor-pointer px-2.5 py-2"
        >
            <div className="grid min-w-0 flex-1 grid-cols-[1fr_120px_120px_140px] items-center gap-4">
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
                        <p className="truncate text-[12px] font-medium text-neutral-400">
                            {secondary}
                        </p>
                    </div>
                </div>

                <div className="min-w-0">
                    {isMember ? (
                        <TeamRoleTicker role={teamMember.role} />
                    ) : (
                        <span className="inline-flex max-w-full items-center gap-x-1.25 truncate rounded-[4px] bg-pink-500/15 px-2 py-0.5 text-[11px] font-medium text-pink-600">
                            {pendingMember.status}
                            <InvitationPendingIcon size={14} />
                        </span>
                    )}
                </div>

                <div className="min-w-0">
                    {isMember && teamMember.projectRole ? (
                        <ProjectRoleTicker role={teamMember.projectRole} />
                    ) : (
                        <span className="inline-flex items-center rounded-full bg-overlay/5 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                            —
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
        </SelectableRow>
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
                    data-row-editor
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                    className="rounded-sm p-0.5 text-neutral-500 outline-none hover:text-neutral-200 disabled:opacity-50 [&_svg]:size-4"
                    aria-label="Invite actions"
                >
                    <OverflowMenuVerticalIcon size={16} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem className={"group"} onClick={() => revoke(invitationId)}>
                    <RevokeInviteIcon
                        className="size-4 text-neutral-400 group-hover:text-danger"
                        aria-hidden
                    />
                    Revoke invite
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
