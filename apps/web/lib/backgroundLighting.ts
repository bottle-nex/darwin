import {
    BackgroundLightingColor,
    CodeTheme,
    ColorScheme,
    DefaultHomeView,
    DiffView,
    SwipeTarget,
} from "@trydarwin/types";

/**
 * `selectionAlpha` is how strongly a selected card or row is washed with the accent.
 * The presets differ a lot in brightness — amber reads about 50% lighter than violet —
 * so a single alpha makes the light colours shout. Each one is scaled by its own
 * perceived luminance to land at violet's weight; violet is the reference and keeps
 * the value the tint started with.
 */
export const BACKGROUND_LIGHTING_PRESETS: Record<
    BackgroundLightingColor,
    { label: string; rgb: string; primary: string; selectionAlpha: string }
> = {
    [BackgroundLightingColor.Violet]: {
        label: "Violet",
        rgb: "132, 114, 245",
        primary: "171, 159, 242",
        selectionAlpha: "0.13",
    },
    [BackgroundLightingColor.Matcha]: {
        label: "Matcha",
        rgb: "155, 194, 79",
        primary: "200, 221, 158",
        selectionAlpha: "0.093",
    },
    [BackgroundLightingColor.Blue]: {
        label: "Blue",
        rgb: "96, 165, 250",
        primary: "168, 205, 252",
        selectionAlpha: "0.106",
    },
    [BackgroundLightingColor.Amber]: {
        label: "Amber",
        rgb: "251, 191, 36",
        primary: "253, 220, 135",
        selectionAlpha: "0.086",
    },
    [BackgroundLightingColor.Rose]: {
        label: "Rose",
        rgb: "244, 114, 182",
        primary: "249, 178, 215",
        selectionAlpha: "0.113",
    },
    // Too desaturated to carry a solid fill, so it borrows violet.
    [BackgroundLightingColor.Neutral]: {
        label: "Neutral",
        rgb: "148, 163, 184",
        primary: "171, 159, 242",
        selectionAlpha: "0.13",
    },
};

export const BACKGROUND_LIGHTING_COLORS = Object.keys(
    BACKGROUND_LIGHTING_PRESETS,
) as BackgroundLightingColor[];

export const FALLBACK_ACCENT_RGB = BACKGROUND_LIGHTING_PRESETS[BackgroundLightingColor.Violet].rgb;

export const NEUTRAL_GLOW_RGB = BACKGROUND_LIGHTING_PRESETS[BackgroundLightingColor.Neutral].rgb;

export function accentRgbFor(rgb: string, enabled: boolean) {
    return enabled && rgb !== NEUTRAL_GLOW_RGB ? rgb : FALLBACK_ACCENT_RGB;
}

export const FALLBACK_PRIMARY_RGB =
    BACKGROUND_LIGHTING_PRESETS[BackgroundLightingColor.Violet].primary;

const PRIMARY_BY_GLOW: Record<string, string> = Object.fromEntries(
    Object.values(BACKGROUND_LIGHTING_PRESETS).map((preset) => [preset.rgb, preset.primary]),
);

// Inlined into the pre-paint script so the first frame matches the hydrated one.
export const PRIMARY_BY_GLOW_JSON = JSON.stringify(PRIMARY_BY_GLOW);

export function primaryRgbFor(rgb: string, enabled: boolean) {
    return enabled ? (PRIMARY_BY_GLOW[rgb] ?? FALLBACK_PRIMARY_RGB) : FALLBACK_PRIMARY_RGB;
}

export const FALLBACK_SELECTION_ALPHA =
    BACKGROUND_LIGHTING_PRESETS[BackgroundLightingColor.Violet].selectionAlpha;

const SELECTION_ALPHA_BY_GLOW: Record<string, string> = Object.fromEntries(
    Object.values(BACKGROUND_LIGHTING_PRESETS).map((preset) => [preset.rgb, preset.selectionAlpha]),
);

// Inlined into the pre-paint script so the first frame matches the hydrated one.
export const SELECTION_ALPHA_BY_GLOW_JSON = JSON.stringify(SELECTION_ALPHA_BY_GLOW);

export function selectionAlphaFor(rgb: string, enabled: boolean) {
    return enabled
        ? (SELECTION_ALPHA_BY_GLOW[rgb] ?? FALLBACK_SELECTION_ALPHA)
        : FALLBACK_SELECTION_ALPHA;
}

export const DEFAULT_USER_CONFIG = {
    backgroundLightingEnabled: true,
    backgroundLightingColor: BackgroundLightingColor.Violet,
    defaultHomeView: DefaultHomeView.Kanban,
    codeTheme: CodeTheme.Darwin,
    diffView: DiffView.Unified,
    swipeTarget: SwipeTarget.Settings,
    colorScheme: ColorScheme.Dark,
};

export const GLOW_STORAGE_KEY = "playground-background-glow";
export const GLOW_RGB_VAR = "--playground-glow-rgb";
export const ACCENT_RGB_VAR = "--playground-accent-rgb";
export const SELECTION_ALPHA_VAR = "--playground-selection-alpha";
export const PRIMARY_RGB_VAR = "--playground-primary-rgb";
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
    root.setProperty(ACCENT_RGB_VAR, accentRgbFor(rgb, enabled));
    root.setProperty(PRIMARY_RGB_VAR, primaryRgbFor(rgb, enabled));
    root.setProperty(SELECTION_ALPHA_VAR, selectionAlphaFor(rgb, enabled));
    root.setProperty(GLOW_OPACITY_VAR, enabled ? "1" : "0");
    root.setProperty(GLOW_X_VAR, `${x}%`);
    root.setProperty(GLOW_Y_VAR, `${y}%`);
}
