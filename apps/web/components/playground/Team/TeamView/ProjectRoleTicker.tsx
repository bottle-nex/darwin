import { ProjectRole } from "@trymatcha/types";
import { cn } from "@/lib/utils";

const SIZES = {
    md: "px-2 py-0.5 text-[11px]",
    sm: "px-1.5 py-0.5 text-[10px]",
} as const;

const ROLE_STYLES: Record<ProjectRole, { label: string; box: string }> = {
    Admin: { label: "Admin", box: "bg-amber-400/10 text-amber-300" },
    Maintain: { label: "Maintain", box: "bg-emerald-400/10 text-emerald-300" },
    Write: { label: "Write", box: "bg-sky-400/10 text-sky-300" },
    Triage: { label: "Triage", box: "bg-violet-400/10 text-violet-300" },
    Read: { label: "Read", box: "bg-white/5 text-neutral-300" },
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
