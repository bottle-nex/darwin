import type { TeamRole } from "@trymatcha/types";

import { cn } from "@/lib/utils";

const SIZES = {
    md: "px-2 py-0.5 text-[11px]",
    sm: "px-1.5 py-0.5 text-[10px]",
} as const;

const ROLE_STYLES: Record<TeamRole, { label: string; box: string }> = {
    Maintainer: { label: "Maintainer", box: "bg-teal-400/10 text-teal-300" },
    Member: { label: "Member", box: "bg-white/5 text-neutral-300" },
};

interface TeamRoleTickerProps {
    role: TeamRole;
    size?: keyof typeof SIZES;
    className?: string;
}

export default function TeamRoleTicker({ role, size = "md", className }: TeamRoleTickerProps) {
    const style = ROLE_STYLES[role];
    if (!style) return null;

    return (
        <span
            className={cn(
                "inline-flex max-w-full items-center truncate rounded-[4px] font-medium",
                SIZES[size],
                style.box,
                className,
            )}
        >
            {style.label}
        </span>
    );
}
