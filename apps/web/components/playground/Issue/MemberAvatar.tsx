"use client";
import type { ProjectMember } from "@/hooks/project/useProjectMembers";
import { cn } from "@/lib/utils";

const MEMBER_TONES = [
    "bg-indigo-600 text-white",
    "bg-emerald-600 text-white",
    "bg-sky-600 text-white",
    "bg-rose-600 text-white",
    "bg-amber-600 text-white",
    "bg-violet-600 text-white",
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
                    "size-6 shrink-0 rounded-full object-cover ring-1 ring-card",
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
