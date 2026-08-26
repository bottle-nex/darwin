"use client";

import { useState } from "react";

import FeatureCard from "./features/FeatureCard";
import { FEATURES } from "./features/features.data";

/** Card open before anything has been hovered. */
const DEFAULT_OPEN_INDEX = 0;

export default function LandingFeatures() {
    const [openIndex, setOpenIndex] = useState(DEFAULT_OPEN_INDEX);

    return (
        <main className="min-h-screen w-screen max-w-7xl mx-auto flex flex-col pt-40">
            <div className="flex flex-col">
                <div className="text-[#8166db] font-medium tracking-tight">Why matcha</div>
                <div className="w-full flex justify-between items-end pt-4">
                    <div className="text-5xl font-medium max-w-xl">
                        The engineer that never leaves the board.
                    </div>

                    <div className="text-base max-w-[28rem]">
                        This isn&apos;t autocomplete. Each issue is picked up, implemented, and
                        proven against a live checkout of your codebase before it ever reaches
                        review.
                    </div>
                </div>
            </div>

            {/* No onMouseLeave: whichever card was hovered last stays open, so the
                row keeps the state the pointer left it in. */}
            <div className="mt-10 flex h-96 items-stretch gap-4">
                {FEATURES.map((feature, index) => (
                    <FeatureCard
                        key={feature.title}
                        feature={feature}
                        index={index}
                        isOpen={index === openIndex}
                        onOpen={() => setOpenIndex(index)}
                    />
                ))}
            </div>
        </main>
    );
}
