"use client";

import { useLayoutEffect } from "react";
import { useParams } from "next/navigation";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useBackgroundLightingStore } from "@/store/playground/useBackgroundLightingStore";
import {
    applyGlowVars,
    BACKGROUND_LIGHTING_PRESETS,
    GLOW_OPACITY_VAR,
    GLOW_STOPS,
    GLOW_STORAGE_KEY,
    GLOW_X_VAR,
    GLOW_Y_VAR,
} from "@/lib/backgroundLighting";

export default function BackgroundLighting() {
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const config = dashboard?.userConfig;
    const angle = useBackgroundLightingStore((state) => state.angle);

    useLayoutEffect(() => {
        if (!config) return;
        const view = {
            rgb: BACKGROUND_LIGHTING_PRESETS[config.backgroundLightingColor].rgb,
            enabled: config.backgroundLightingEnabled,
            angle,
        };
        applyGlowVars(view);
        localStorage.setItem(GLOW_STORAGE_KEY, JSON.stringify(view));
    }, [config, angle]);

    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-ink">
            <div
                className="absolute inset-0 transition-opacity duration-200"
                style={{
                    opacity: `var(${GLOW_OPACITY_VAR}, 1)`,
                    background: `radial-gradient(ellipse 230% 210% at var(${GLOW_X_VAR}, 2.4%) var(${GLOW_Y_VAR}, 22.5%), ${GLOW_STOPS})`,
                }}
            />
            <div className="grain absolute inset-0 opacity-[0.01]" />
        </div>
    );
}
