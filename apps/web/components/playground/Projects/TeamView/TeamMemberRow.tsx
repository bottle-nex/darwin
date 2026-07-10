import { formatDate } from "@/lib/format";
import type { PendingInviteDetail, TeamMemberDetail } from "@/types/team";
import PlaygroundAvatar, {
    initialOf,
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import ProjectRoleTicker from "./ProjectRoleTicker";
import { MdJoinLeft } from "react-icons/md";

type MemberDetailProps =
    | {
          teamMember: TeamMemberDetail;
          pendingMember?: never;
      }
    | {
          teamMember?: never;
          pendingMember: PendingInviteDetail;
      };

export default function PlaygroundTeamMemberRow({ teamMember, pendingMember }: MemberDetailProps) {
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
                    size="xl"
                    src={user.image}
                    letter={initialOf(user.name, user.email)}
                    tone={toneFor(toneKey)}
                />
                <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-neutral-200">{name}</p>
                    <p className="truncate text-[12px] text-neutral-500">{secondary}</p>
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

            <div className="text-[12px] text-neutral-400">{formatDate(joined)}</div>
        </div>
    );
}
