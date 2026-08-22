"use client";
import type { ProductDiffShot, ProductReviewShot } from "@trymatcha/types";
import { BLURRED_BG_ONE } from "@/components/playground/Home/KanbanDisplay/cardStyles";
import { MICRO_LABEL } from "@/components/playground/Core/components/paneBar";
import { useUserConfig } from "@/hooks/user/useUserConfig";
import TapToOpenImage from "@/components/utility/TapToOpenImage";
import { cn } from "@/lib/utils";

export default function DiffComparison({
    shot,
    urls,
}: {
    shot: ProductDiffShot | ProductReviewShot;
    urls: Record<string, string>;
}) {
    const glass = useUserConfig().backgroundLightingEnabled;
    const base = shot.baseKey ? urls[shot.baseKey] : undefined;
    const head = shot.headKey ? urls[shot.headKey] : undefined;

    return (
        <div data-lenis-prevent className="min-h-0 flex-1 overflow-auto no-scrollbar">
            <div className="flex flex-col gap-4">
                <Side
                    label="Before"
                    src={base}
                    absent={shot.error ?? "Added in this pull request"}
                    glass={glass}
                />
                <Side
                    label="After"
                    src={head}
                    absent={shot.error ?? "Removed in this pull request"}
                    glass={glass}
                />
            </div>
        </div>
    );
}

function Side({
    label,
    src,
    absent,
    glass,
}: {
    label: string;
    src?: string;
    absent: string;
    glass: boolean;
}) {
    return (
        <section className="flex min-w-0 flex-col gap-2">
            <span className={MICRO_LABEL}>{label}</span>
            <div
                className={cn(
                    "overflow-hidden rounded-lg border border-snow/5 p-1.5",
                    BLURRED_BG_ONE(glass),
                )}
            >
                {src ? (
                    <TapToOpenImage
                        src={src}
                        alt={label}
                        fileName={`${label.toLowerCase()}.png`}
                        className="rounded-md"
                    />
                ) : (
                    <p className="px-4 py-10 text-center text-[13px] text-neutral-500">{absent}</p>
                )}
            </div>
        </section>
    );
}
