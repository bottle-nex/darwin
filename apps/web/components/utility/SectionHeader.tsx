import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionHeaderProps {
    header: string;
    title: ReactNode;
    description?: string;
}

export default function SectionHeader({ title, header, description }: SectionHeaderProps) {
    return (
        <div className="w-full h-auto flex flex-col items-start max-w-170">
            <div className={cn("text-neutral-400 text-2xl")}>{header}</div>

            <div className="text-neutral-900 text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-left leading-[1.08] sm:leading-[1.02] -mt-1">
                {title}
            </div>

            <div className="text-neutral-500 text-base mt-4 text-left leading-[1.3]">
                {description}
            </div>
        </div>
    );
}
