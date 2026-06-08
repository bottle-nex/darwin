import Image from "next/image";
import { Flag } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { PendingInviteDetail, TeamMemberDetail } from "@/types/team";

type MemberDetailProps =
    | {
          teamMember: TeamMemberDetail;
          pendingMember?: never;
      }
    | {
          teamMember?: never;
          pendingMember: PendingInviteDetail;
      };

export default function PlaygroundTeamMemberRow({
    teamMember,
    pendingMember,
}: MemberDetailProps) {
    const isMember = !!teamMember;

    const user = isMember
        ? teamMember.user
        : {
              name: null,
              email: pendingMember.user.email,
              image: null,
          };
    
    const email = isMember
        ? teamMember.user.email
        : `invited by: ${pendingMember.invitedBy.name} | ${pendingMember.invitedBy.email}`

    const name = user.name?.trim() || user.email;

    return (
        <div className="flex items-center gap-4 rounded-[7px] ring-1 ring-white/5 bg-neutral-800/30 px-3 py-2.5 hover:bg-neutral-800/55 cursor-pointer">
            {user.image ? (
                <Image
                    src={user.image}
                    alt=""
                    width={36}
                    height={36}
                    unoptimized
                    className="size-9 shrink-0 rounded-full object-cover"
                />
            ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-[13px] font-medium text-neutral-200">
                    {name.charAt(0).toUpperCase()}
                </span>
            )}

            <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-neutral-100">
                    {name}
                </p>

                <p className="truncate text-[12px] text-neutral-500">
                    {email}
                </p>
            </div>

            <div className="hidden w-28 shrink-0 text-[12px] text-neutral-400 sm:block">
                {isMember ? (
                    <>
                        Role:{" "}
                        <span className="font-medium text-neutral-200">
                            {teamMember.role}
                        </span>
                    </>
                ) : (
                    <>
                        Status:{" "}
                        <span className="font-medium text-neutral-200">
                            {pendingMember.status}
                        </span>
                    </>
                )}
            </div>

            <div className="flex w-36 shrink-0 items-center gap-1.5 text-[12px] text-neutral-400">
                <Flag className="size-3.5 shrink-0 text-neutral-500" aria-hidden />

                {isMember
                    ? formatDate(teamMember.createdAt)
                    : formatDate(pendingMember.sentAt)}
            </div>
        </div>
    );
}