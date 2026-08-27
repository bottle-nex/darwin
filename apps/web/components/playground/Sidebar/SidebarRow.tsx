"use client";
import { AccessRestrictedIcon } from "@trymatcha/ui/icons";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RowProps = {
    className?: string;
    leading?:
        | { kind: "icon"; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }
        | { kind: "node"; node: React.ReactNode };
    label: string;
    suffix?: string;
    badge?: number;
    indent?: number;
    size?: number;
    active?: boolean;
    onClick?: () => void;
    trailing?: React.ReactNode;
    isLocked?: boolean;
};

export default function PlaygroundSidebarRow({
    className,
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
        <Button
            variant="unstyled"
            type="button"
            onClick={onClick}
            className={cn(
                "group flex w-full cursor-pointer items-center gap-1 rounded-md py-1 pr-2.5 text-left text-[13.25px] ring-inset focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-hidden rounded-[5px] tracking-wider font-medium",
                active
                    ? "bg-white/7 text-neutral-50"
                    : "text-neutral-300 hover:bg-white/3 hover:text-neutral-100",
                className,
            )}
            style={{ paddingLeft: 8 + indent * 16 }}
        >
            <span className="flex size-5 shrink-0 items-center justify-center">
                {Icon ? (
                    <Icon className={cn(size ? `size-${size}` : "size-3.75")} aria-hidden />
                ) : leading?.kind === "node" ? (
                    leading.node
                ) : null}
            </span>

            <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
                <span className="truncate text-[13.5px]">{label}</span>
                {suffix && (
                    <span className="truncate text-[10px] text-neutral-500">- {suffix}</span>
                )}
            </span>

            {badge !== undefined && (
                <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-[8px] font-medium tabular-nums text-neutral-300">
                    {badge}
                </span>
            )}

            {trailing && <span className="ml-1 flex shrink-0 items-center gap-1">{trailing}</span>}

            {isLocked && (
                <span className="flex size-5 shrink-0 items-center justify-center text-neutral-400 ">
                    <AccessRestrictedIcon className="size-3.5" />
                </span>
            )}
        </Button>
    );
}
