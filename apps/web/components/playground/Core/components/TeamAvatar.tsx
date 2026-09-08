"use client";

import type { IconPick } from "@trydarwin/types";

import PlaygroundAvatar, {
    type AvatarSize,
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";

/**
 * One way to draw a team: its picked icon, falling back to a letter tile whose
 * tone is derived from the id — so no screen hardcodes a colour of its own.
 */
export default function TeamAvatar({
    team,
    size,
    className,
}: {
    team: { id: string; name: string; icon?: IconPick | null };
    size?: AvatarSize;
    className?: string;
}) {
    return (
        <PlaygroundAvatar
            letter={team.name.trim().charAt(0).toUpperCase()}
            tone={toneFor(team.id)}
            icon={team.icon}
            size={size}
            className={className}
        />
    );
}
