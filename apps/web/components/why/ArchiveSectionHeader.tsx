import type { ReactNode } from "react";
import Reveal from "@/components/utility/Reveal";

export function ArchiveSectionHeader({ headline }: { headline: ReactNode }) {
    return (
        <Reveal>
            <h2 className="text-4xl font-extralight leading-[1.05] tracking-tight text-neutral-100 sm:text-5xl lg:text-6xl">
                {headline}
            </h2>
        </Reveal>
    );
}
