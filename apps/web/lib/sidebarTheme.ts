import { SidebarTheme, type SidebarGradientKey } from "@/types/sidebarTheme.type";

export const SIDEBAR_GRADIENT_CSS_VAR = "--sidebar-gradient";
export const SIDEBAR_THEME_STORAGE_KEY = "playground-sidebar-theme";
export const SIDEBAR_THEME_DEFAULT: SidebarTheme = SidebarTheme.TimeOfDay;

export const SIDEBAR_MESH_PALETTES: Record<SidebarGradientKey, string[] | null> = {
    dawn: ["#1b1830", "#302044", "#4a283c", "#12101c"],
    morning: ["#1d3a34", "#22443a", "#2e4626", "#141f1c"],
    afternoon: ["#22333a", "#2a4048", "#334030", "#151d21"],
    dusk: ["#3a1f1a", "#4d2422", "#341c38", "#170f12"],
    evening: ["#161a33", "#201c40", "#2b1e40", "#0e0f1c"],
    midnight: ["#0d1018", "#141a2b", "#1a1a2e", "#08090e"],
    matcha: ["#1d2a12", "#294016", "#31491a", "#101507"],
    lilac: ["#221c3d", "#332a5c", "#403570", "#100d1c"],
    ember: ["#2e1210", "#4d1c15", "#5f2812", "#160a08"],
    slate: ["#151d2a", "#202d40", "#2b3d54", "#0b0f16"],
    neutral: null,
};

export const TIME_OF_DAY_BANDS: { startHour: number; key: SidebarGradientKey }[] = [
    { startHour: 0, key: "midnight" },
    { startHour: 5, key: "dawn" },
    { startHour: 8, key: "morning" },
    { startHour: 12, key: "afternoon" },
    { startHour: 17, key: "dusk" },
    { startHour: 20, key: "evening" },
    { startHour: 23, key: "midnight" },
];

const NAMED_GRADIENT_KEYS: Record<SidebarTheme, SidebarGradientKey | null> = {
    [SidebarTheme.TimeOfDay]: null,
    [SidebarTheme.Matcha]: "matcha",
    [SidebarTheme.Lilac]: "lilac",
    [SidebarTheme.Ember]: "ember",
    [SidebarTheme.Slate]: "slate",
    [SidebarTheme.Neutral]: "neutral",
};

export const SIDEBAR_THEME_OPTIONS: { theme: SidebarTheme; label: string }[] = [
    { theme: SidebarTheme.TimeOfDay, label: "Time of day" },
    { theme: SidebarTheme.Matcha, label: "Matcha" },
    { theme: SidebarTheme.Lilac, label: "Lilac" },
    { theme: SidebarTheme.Ember, label: "Ember" },
    { theme: SidebarTheme.Slate, label: "Slate" },
    { theme: SidebarTheme.Neutral, label: "Neutral" },
];

export function resolveTimeOfDayKey(hour: number): SidebarGradientKey {
    let key = TIME_OF_DAY_BANDS[0].key;
    for (const band of TIME_OF_DAY_BANDS) {
        if (hour >= band.startHour) key = band.key;
    }
    return key;
}

export function resolveGradientKey(theme: SidebarTheme, hour: number): SidebarGradientKey {
    return NAMED_GRADIENT_KEYS[theme] ?? resolveTimeOfDayKey(hour);
}

export function meshPaletteFor(key: SidebarGradientKey): string[] | null {
    return SIDEBAR_MESH_PALETTES[key];
}

export function flatGradientFor(key: SidebarGradientKey): string | null {
    const palette = SIDEBAR_MESH_PALETTES[key];
    if (!palette) return null;
    return `linear-gradient(155deg, ${palette.join(", ")})`;
}

export function applySidebarGradient(key: SidebarGradientKey) {
    const gradient = flatGradientFor(key);
    if (gradient === null) {
        document.documentElement.style.removeProperty(SIDEBAR_GRADIENT_CSS_VAR);
        return;
    }
    document.documentElement.style.setProperty(SIDEBAR_GRADIENT_CSS_VAR, gradient);
}

export const SIDEBAR_GRADIENT_BOOTSTRAP_SCRIPT = `try{
var bands=${JSON.stringify(TIME_OF_DAY_BANDS)};
var named=${JSON.stringify(NAMED_GRADIENT_KEYS)};
var palettes=${JSON.stringify(SIDEBAR_MESH_PALETTES)};
var stored=localStorage.getItem(${JSON.stringify(SIDEBAR_THEME_STORAGE_KEY)});
var theme=(stored&&JSON.parse(stored).state.theme)||${JSON.stringify(SIDEBAR_THEME_DEFAULT)};
var key=named[theme];
if(!key){var h=new Date().getHours();key=bands[0].key;for(var i=0;i<bands.length;i++){if(h>=bands[i].startHour)key=bands[i].key}}
var palette=palettes[key];
if(palette)document.documentElement.style.setProperty(${JSON.stringify(SIDEBAR_GRADIENT_CSS_VAR)},"linear-gradient(155deg, "+palette.join(", ")+")")
}catch(e){}`;
