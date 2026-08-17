import { cn } from "@/lib/utils";
import type { IconType } from "react-icons";

interface IconWrapperProps {
    icon: IconType;
    active?: boolean;
    className?: string;
}

export default function IconWrapper({ icon: Icon, active, className }: IconWrapperProps) {
    return (
        <span
            className={cn(
                "flex size-6.25 items-center justify-center rounded-full ring-[0.5px] transition-colors",
                active
                    ? "bg-white/8 text-neutral-100 ring-white/12"
                    : "bg-white/5 text-neutral-400 ring-white/8 group-hover:bg-white/8 group-hover:text-neutral-200",
                className,
            )}
        >
            <Icon className="size-3.25" aria-hidden />
        </span>
    );
}
