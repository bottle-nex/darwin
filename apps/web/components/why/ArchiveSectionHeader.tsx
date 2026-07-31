import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Reveal from "@/components/utility/Reveal";
import { Stamp } from "./Stamp";

export function ArchiveSectionHeader({ headline, stamp }: { headline: ReactNode; stamp?: string }) {
    return (
        <div>
            {stamp && (
                <div className="flex justify-end border-b border-white/10 pb-4">
                    <Stamp label={stamp} rotate={-2} />
                </div>
            )}
            <Reveal>
                <h2
                    className={cn(
                        "text-4xl font-extralight leading-[1.05] tracking-tight text-neutral-100 sm:text-5xl lg:text-6xl",
                        stamp && "mt-8",
                    )}
                >
                    {headline}
                </h2>
            </Reveal>
        </div>
    );
}
