import type { Feature } from "@/types/feature.type";
import ScatterField from "./ScatterField";
import { TEASER_WIDTH } from "./cardMetrics";

/**
 * The collapsed face of a feature card: index top-left, scattered squares, title
 * pinned to the bottom.
 *
 * Fixed width for the same reason as FeatureDetail — the title must not rewrap
 * while the card is animating.
 */
export default function FeatureTeaser({ feature, index }: { feature: Feature; index: number }) {
    return (
        <div className="flex h-full flex-col p-7" style={{ width: TEASER_WIDTH }}>
            <div className="text-[2.5rem] font-medium leading-none tracking-tight text-[#D8D5CC]">
                {`${String(index + 1).padStart(2, "0")}.`}
            </div>

            <ScatterField seed={index + 1} />

            <div className="text-lg tracking-tight text-[#2a2524]">{feature.title}</div>
        </div>
    );
}
