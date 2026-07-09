import Image from "next/image";
import { formatDate } from "@/lib/format";
import type { PendingInviteDetail, TeamMemberDetail } from "@/types/team";
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

    const name = user.name?.trim() || user.email;
    const secondary = isMember
        ? teamMember.user.email
        : `Invited by ${pendingMember.invitedBy.name ?? pendingMember.invitedBy.email}`;

    const joined = isMember ? teamMember.createdAt : pendingMember.sentAt;

    return (
        <div className="grid grid-cols-[1fr_120px_140px] items-center gap-4 rounded-md px-2.5 py-2 hover:bg-neutral-800/50 cursor-pointer">
            <div className="flex min-w-0 items-center gap-3">
                {user.image ? (
                    <Image
                        src={user.image}
                        alt=""
                        width={32}
                        height={32}
                        unoptimized
                        className="size-8 shrink-0 rounded-full object-cover"
                    />
                ) : (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-[12px] font-medium text-neutral-200">
                        {name.charAt(0).toUpperCase()}
                    </span>
                )}
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
