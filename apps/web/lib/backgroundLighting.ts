import { BackgroundLightingColor } from "@trymatcha/types";

export const BACKGROUND_LIGHTING_PRESETS: Record<
    BackgroundLightingColor,
    { label: string; rgb: string }
> = {
    [BackgroundLightingColor.Violet]: { label: "Violet", rgb: "132, 114, 245" },
    [BackgroundLightingColor.Matcha]: { label: "Matcha", rgb: "155, 194, 79" },
    [BackgroundLightingColor.Blue]: { label: "Blue", rgb: "96, 165, 250" },
    [BackgroundLightingColor.Amber]: { label: "Amber", rgb: "251, 191, 36" },
    [BackgroundLightingColor.Rose]: { label: "Rose", rgb: "244, 114, 182" },
    [BackgroundLightingColor.Neutral]: { label: "Neutral", rgb: "148, 163, 184" },
};

export const BACKGROUND_LIGHTING_COLORS = Object.keys(
    BACKGROUND_LIGHTING_PRESETS,
) as BackgroundLightingColor[];

export const DEFAULT_USER_CONFIG = {
    backgroundLightingEnabled: true,
    backgroundLightingColor: BackgroundLightingColor.Violet,
};

export const GLOW_STORAGE_KEY = "playground-background-glow";
export const GLOW_RGB_VAR = "--playground-glow-rgb";
export const GLOW_OPACITY_VAR = "--playground-glow-opacity";
export const GLOW_X_VAR = "--playground-glow-x";
export const GLOW_Y_VAR = "--playground-glow-y";

const GLOW_PEAK_ALPHA = 0.111;
const GLOW_STOP_COUNT = 40;

export const GLOW_STOPS = Array.from({ length: GLOW_STOP_COUNT + 1 }, (_, index) => {
    const distance = index / GLOW_STOP_COUNT;
    const falloff = (0.5 + 0.5 * Math.cos(Math.PI * distance)) ** 1.3;
    const alpha = (GLOW_PEAK_ALPHA * falloff).toFixed(4);
    return `rgba(var(${GLOW_RGB_VAR}, 132, 114, 245), ${alpha}) ${(distance * 100).toFixed(1)}%`;
}).join(", ");

export function glowPositionFor(angle: number) {
    const radians = (angle * Math.PI) / 180;
    return {
        x: 50 + Math.cos(radians) * 55,
        y: 50 + Math.sin(radians) * 55,
    };
}

export type GlowView = { rgb: string; enabled: boolean; angle: number };

export function applyGlowVars({ rgb, enabled, angle }: GlowView) {
    const { x, y } = glowPositionFor(angle);
    const root = document.documentElement.style;
    root.setProperty(GLOW_RGB_VAR, rgb);
    root.setProperty(GLOW_OPACITY_VAR, enabled ? "1" : "0");
    root.setProperty(GLOW_X_VAR, `${x}%`);
    root.setProperty(GLOW_Y_VAR, `${y}%`);
}
