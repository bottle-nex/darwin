import Image from "next/image";
import { Flag } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { TeamMemberDetail } from "@/types/team";

export default function PlaygroundTeamMemberRow({ member }: { member: TeamMemberDetail }) {
    const name = member.user.name?.trim() || member.user.email;

    return (
        <div className="flex items-center gap-4 rounded-lg ring-1 ring-white/5 bg-neutral-800/30 px-3 py-2.5 hover:bg-neutral-800/55 cursor-pointer">
            {member.user.image ? (
                <Image
                    src={member.user.image}
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
                <p className="truncate text-[13px] font-medium text-neutral-100">{name}</p>
                <p className="truncate text-[12px] text-neutral-500">{member.user.email}</p>
            </div>

            <div className="hidden w-28 shrink-0 text-[12px] text-neutral-400 sm:block">
                Role: <span className="font-medium text-neutral-200">{member.role}</span>
            </div>

            <div className="flex w-36 shrink-0 items-center gap-1.5 text-[12px] text-neutral-400">
                <Flag className="size-3.5 shrink-0 text-neutral-500" aria-hidden />
                {formatDate(member.createdAt)}
            </div>
        </div>
    );
}
