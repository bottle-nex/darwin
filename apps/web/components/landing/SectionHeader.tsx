import { cn } from "@/lib/utils";

import BlurFade from "./BlurFade";

type SectionHeaderProps = {
    title: string;
    titleContinued?: string;
    description: string;
    className?: string;
    delay?: number;
    duration?: number;
};

export default function SectionHeader({
    title,
    titleContinued,
    description,
    className,
}: SectionHeaderProps) {
    return (
        <div className={cn("flex flex-col items-start", className)}>
            <BlurFade duration={1.5} delay={0}>
                <h2 className="max-w-4xl text-[1.75rem] sm:text-[2rem] md:text-[2.5rem] leading-tight tracking-tight font-headline">
                    <span className="text-foreground font-headline font-medium">{title} </span>
                    <span className="text-muted-foreground/70 font-pixel">{titleContinued}</span>
                </h2>
            </BlurFade>
            <BlurFade delay={0.1} duration={1.2}>
                <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground md:text-lg">
                    {description}
                </p>
            </BlurFade>
        </div>
    );
}
