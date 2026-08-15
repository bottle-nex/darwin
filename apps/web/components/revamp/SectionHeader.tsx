import { cn } from "@/lib/utils";

type SectionHeaderProps = {
    title: string;
    titleContinued: string;
    description: string;
    className?: string;
};

export default function SectionHeader({
    title,
    titleContinued,
    description,
    className,
}: SectionHeaderProps) {
    return (
        <div className={cn("flex flex-col items-start", className)}>
            <h2 className="max-w-4xl indent-24 text-[2.5rem] leading-tight tracking-tight">
                <span className="text-snow">{title} </span>
                <span className="text-neutral-500">{titleContinued}</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-neutral-500 md:text-lg">
                {description}
            </p>
        </div>
    );
}
