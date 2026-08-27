"use client";
import { ProjectReferenceIcon } from "@trymatcha/ui/icons";

import PlaygroundAvatar, {
    displayNameOf,
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { useProjectPresence } from "@/hooks/project/useProjectPresence";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";

type UserInfoCardProps = {
    userId: string;
    fallbackName: string;
    fallbackImage: string | null;
};

export default function UserInfoCard({ userId, fallbackName, fallbackImage }: UserInfoCardProps) {
    const project = useActiveProject();
    const { data: members } = useProjectMembers(project?.id);
    const { data: onlineUserIds } = useProjectPresence(project?.id);

    const member = members?.find((m) => m.id === userId);
    const name = member ? displayNameOf(member.name, member.email) : fallbackName;
    const image = member?.image ?? fallbackImage;
    const isOnline = onlineUserIds?.has(userId) ?? false;

    return (
        <div>
            <div className="flex items-center gap-2.5">
                <PlaygroundAvatar
                    letter={(name.trim()[0] ?? "?").toUpperCase()}
                    src={image}
                    tone={toneFor(userId)}
                    size="xl"
                    className="rounded-full"
                />
                <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-snow">{name}</p>
                    {member && (
                        <p className="truncate text-[11.5px] text-neutral-500">{member.email}</p>
                    )}
                </div>
            </div>

            <div className="my-2.5 h-px bg-white/5" />

            <div className="space-y-1.5 text-[12.5px] text-snow/80">
                <div className="flex items-center gap-2">
                    <span className="flex size-3.5 items-center justify-center">
                        <span
                            aria-hidden
                            className={cn(
                                "size-1.5 rounded-full",
                                isOnline ? "bg-emerald-400" : "bg-neutral-500",
                            )}
                        />
                    </span>
                    <span>{isOnline ? "Online" : "Offline"}</span>
                </div>
                {member && project && (
                    <div className="flex items-center gap-2">
                        <ProjectReferenceIcon className="size-3.5 shrink-0 text-neutral-500" />
                        <span className="truncate">{project.name}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
