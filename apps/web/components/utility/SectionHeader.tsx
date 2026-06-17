import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionHeaderProps {
    header: string;
    title: ReactNode;
    description?: string;
    align?: "left" | "center";
}

export default function SectionHeader({
    title,
    header,
    description,
    align = "left",
}: SectionHeaderProps) {
    const centered = align === "center";
    return (
        <div
            className={cn(
                "w-full h-auto flex flex-col max-w-170",
                centered ? "items-center mx-auto" : "items-start",
            )}
        >
            <div className={cn("text-neutral-400 text-2xl")}>{header}</div>

            <div
                className={cn(
                    "text-neutral-900 text-4xl sm:text-6xl md:text-7xl font-light tracking-tight leading-[1.08] sm:leading-[1.02] -mt-1",
                    centered ? "text-center" : "text-left",
                )}
            >
                {title}
            </div>

            <div
                className={cn(
                    "text-neutral-500 text-base mt-4 leading-[1.3]",
                    centered ? "text-center" : "text-left",
                )}
            >
                {description}
            </div>
        </div>
    );
}
