export type ColorScheme = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

/**
 * Kept clear of React so the pre-hydration script, which renders from a server
 * component, can read the key without pulling client-only code into the server
 * graph.
 */
export const PLAYGROUND_THEME_STORAGE_KEY = "playground-theme";

const SCHEMES: ColorScheme[] = ["dark", "light", "system"];

export function isScheme(value: unknown): value is ColorScheme {
    return typeof value === "string" && (SCHEMES as string[]).includes(value);
}

export function resolveTheme(scheme: ColorScheme, systemPrefersDark: boolean): ResolvedTheme {
    if (scheme === "system") return systemPrefersDark ? "dark" : "light";
    return scheme;
}
