import { SidebarTheme } from "@trymatcha/types";

export { SidebarTheme };

export type SidebarGradientKey =
    | "dawn"
    | "morning"
    | "afternoon"
    | "dusk"
    | "evening"
    | "midnight"
    | "matcha"
    | "lilac"
    | "ember"
    | "slate"
    | "neutral";

export interface SidebarThemePreference {
    sidebarTheme: SidebarTheme;
}
