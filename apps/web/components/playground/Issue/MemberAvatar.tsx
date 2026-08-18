"use client";
import { cn } from "@/lib/utils";
import type { ProjectMember } from "@/hooks/project/useProjectMembers";

const MEMBER_TONES = [
    "bg-indigo-500/30 text-indigo-100",
    "bg-emerald-500/30 text-emerald-100",
    "bg-sky-500/30 text-sky-100",
    "bg-rose-500/30 text-rose-100",
    "bg-amber-500/30 text-amber-100",
    "bg-violet-500/30 text-violet-100",
];

function memberTone(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return MEMBER_TONES[hash % MEMBER_TONES.length];
}

export default function MemberAvatar({
    member,
    className,
}: {
    member: ProjectMember;
    className?: string;
}) {
    const initial = (member.name?.trim()?.[0] ?? member.email[0] ?? "?").toUpperCase();

    if (member.image) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={member.image}
                alt=""
                className={cn(
                    "size-6 shrink-0 rounded-full object-cover ring-1 ring-white/10",
                    className,
                )}
            />
        );
    }

    return (
        <span
            className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                memberTone(member.id),
                className,
            )}
        >
            {initial}
        </span>
    );
}
