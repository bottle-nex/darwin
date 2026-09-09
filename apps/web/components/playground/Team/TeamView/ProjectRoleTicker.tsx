import type { ProjectRole } from "@trydarwin/types";

import { cn } from "@/lib/utils";

const SIZES = {
    md: "px-2 py-0.5 text-[11px]",
    sm: "px-1.5 py-0.5 text-[10px]",
} as const;

const ROLE_STYLES: Record<ProjectRole, { label: string; box: string }> = {
    Admin: { label: "Admin", box: "bg-amber-500/15 text-amber-600" },
    Maintain: { label: "Maintain", box: "bg-emerald-500/15 text-emerald-600" },
    Write: { label: "Write", box: "bg-sky-500/15 text-sky-600" },
    Triage: { label: "Triage", box: "bg-violet-500/15 text-violet-500" },
    Read: { label: "Read", box: "bg-overlay/5 text-neutral-300" },
};

interface ProjectRoleTickerProps {
    role: ProjectRole;
    size?: keyof typeof SIZES;
    className?: string;
}

export default function ProjectRoleTicker({
    role,
    size = "md",
    className,
}: ProjectRoleTickerProps) {
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
