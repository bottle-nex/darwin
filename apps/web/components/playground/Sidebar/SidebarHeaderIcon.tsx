"use client";
import { cn } from "@/lib/utils";

type PlaygroundSidebarHeaderIconProps = {
    label: string;
    onClick?: () => void;
    children: React.ReactNode;
};

export default function SidebarHeaderIcon({
    label,
    onClick,
    children,
}: PlaygroundSidebarHeaderIconProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={cn(
                "flex size-7 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-white/5 hover:text-neutral-100",
            )}
        >
            {children}
        </button>
    );
}
