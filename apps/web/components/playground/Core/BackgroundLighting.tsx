"use client";

import { useBackgroundLightingStore } from "@/store/playground/useBackgroundLightingStore";

export default function BackgroundLighting() {
    const angle = useBackgroundLightingStore((state) => state.angle);
    const angleInRadians = (angle * Math.PI) / 180;
    const lightX = 50 + Math.cos(angleInRadians) * 55;
    const lightY = 50 + Math.sin(angleInRadians) * 55;
    const background = `radial-gradient(ellipse 48% 44% at ${lightX}% ${lightY}%, rgba(117, 110, 194, 0.17) 0%, rgba(117, 110, 194, 0.164) 10%, rgba(117, 110, 194, 0.148) 20%, rgba(117, 110, 194, 0.124) 30%, rgba(117, 110, 194, 0.097) 40%, rgba(117, 110, 194, 0.071) 50%, rgba(117, 110, 194, 0.048) 60%, rgba(117, 110, 194, 0.03) 70%, rgba(117, 110, 194, 0.017) 80%, rgba(117, 110, 194, 0.008) 90%, rgba(117, 110, 194, 0) 100%)`;

    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-ink">
            <div className="absolute inset-0" style={{ background }} />
            <div className="grain absolute inset-0 opacity-[0.08]" />
        </div>
    );
}
