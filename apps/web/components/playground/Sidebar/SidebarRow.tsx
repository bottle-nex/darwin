"use client";

import { HiOutlineLockClosed } from "react-icons/hi2";
import { cn } from "@/lib/utils";

type RowProps = {
    /** Leading slot — supply either an icon or a fully-formed react node (e.g. an avatar). */
    leading?:
    | { kind: "icon"; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }
    | { kind: "node"; node: React.ReactNode };
    label: string;
    /** Lighter trailing text that follows the label after a dash. */
    suffix?: string;
    badge?: number;
    indent?: number;
    size?: number;
    active?: boolean;
    onClick?: () => void;
    /** Trailing actions revealed on hover (e.g. ellipsis + plus). */
    trailing?: React.ReactNode;
    isLocked?: boolean;
};

/**
 * Generic sidebar row. Used everywhere — primary nav, projects, teams, agents.
 * Keeps spacing/typography consistent without each section reimplementing it.
 */
export default function PlaygroundSidebarRow({
    leading,
    label,
    suffix,
    badge,
    size,
    indent = 0,
    active = false,
    onClick,
    trailing,
    isLocked,
}: RowProps) {
    const Icon = leading?.kind === "icon" ? leading.icon : null;

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "group flex w-full cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2 text-left text-[13px]",
                active
                    ? "bg-white/10 text-neutral-100"
                    : "text-neutral-300 hover:bg-white/5 hover:text-neutral-100",
            )}
            style={{ paddingLeft: 8 + indent * 16 }}
        >
            <span className="flex size-5 shrink-0 items-center justify-center text-neutral-400">
                {Icon ? (
                    <Icon className={cn(size ? `size-${size}` : "size-3.75")} aria-hidden />
                ) : leading?.kind === "node" ? (
                    leading.node
                ) : null}
            </span>

            <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
                <span className="truncate text-[12.5px]">{label}</span>
                {suffix && (
                    <span className="truncate text-[10px] text-neutral-500">- {suffix}</span>
                )}
            </span>

            {badge !== undefined && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded text-[7px] font-medium text-neutral-400">
                    <span className="mr-0.5 size-2.5 rounded-sm bg-neutral-700" aria-hidden />
                    {badge}
                </span>
            )}

            {trailing && (
                <span className="ml-1 hidden items-center gap-1 group-hover:flex">{trailing}</span>
            )}

            {isLocked && (
                <span className="flex size-5 shrink-0 items-center justify-center text-neutral-400 ">
                    <HiOutlineLockClosed className="size-3.5" />
                </span>
            )}
        </button>
    );
}
