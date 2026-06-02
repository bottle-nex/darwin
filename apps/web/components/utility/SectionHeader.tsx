import { cn } from "@/lib/utils";

interface SectionHeaderProps {
    header: string;
    title: string;
    description?: string;
}

export default function SectionHeader({ title, header, description }: SectionHeaderProps) {
    return (
        <div className="w-full h-auto flex flex-col items-center max-w-160">
            <div className={cn("text-neutral-400 text-2xl")}>{header}</div>

            <div className="text-neutral-900 text-5xl font-semibold tracking-tight text-center -mt-1">
                {title}
            </div>

            <div className="text-neutral-500 text-base mt-4 text-center leading-[1.3]">
                {description}
            </div>
        </div>
    );
}
