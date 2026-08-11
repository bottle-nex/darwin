import type { Feature } from "@/types/feature.type";
import { DETAIL_WIDTH } from "./cardMetrics";

/**
 * The expanded face of a feature card: the card's own media panel on top, title
 * and body below.
 *
 * Laid out at a fixed width rather than filling the card, so the copy keeps its
 * line breaks while the card's edges animate. Anything width-relative here would
 * rewrap on every frame of the expand.
 */
export default function FeatureDetail({ feature }: { feature: Feature }) {
    const { Media } = feature;

    return (
        <div className="flex h-full flex-col p-2" style={{ width: DETAIL_WIDTH }}>
            {/* A percentage, so the panel keeps its proportion if the row's height
                changes. The remainder has to hold the longest body copy — at the
                current card height that tops out around 55%. */}
            <div className="grain relative h-[52%] overflow-hidden rounded-2xl bg-[#EAE8E2]">
                <Media />
            </div>

            <div className="flex flex-1 flex-col justify-center gap-3 px-5">
                <div className="text-[1.6rem] font-semibold leading-[1.15] tracking-tight text-[#2a2524]">
                    {feature.title}
                </div>

                <div className="text-[0.85rem] leading-relaxed text-[#5c5751]">{feature.body}</div>
            </div>
        </div>
    );
}
