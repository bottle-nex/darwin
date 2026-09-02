export type IconPick =
    { kind: "icon"; name: string; color: string } | { kind: "emoji"; char: string };

/** Icons are stored in `Json` columns, so a row hands them back untyped. */
export function as_icon_pick(value: unknown): IconPick | null {
    if (typeof value !== "object" || value === null) return null;
    const pick = value as Partial<IconPick>;
    if (pick.kind === "icon") {
        return typeof pick.name === "string" && typeof pick.color === "string"
            ? { kind: "icon", name: pick.name, color: pick.color }
            : null;
    }
    if (pick.kind === "emoji") {
        return typeof pick.char === "string" ? { kind: "emoji", char: pick.char } : null;
    }
    return null;
}
