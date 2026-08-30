import { addDays, endOfMonth, nextSaturday } from "date-fns";

/**
 * A named jump to a single date. Every shortcut resolves to one day, so the
 * picker's pills and the command menu's date pages can share one list.
 *
 * `resolve` is called on click, never during render, so "today" is read at the
 * moment someone picks rather than whenever the component last rendered.
 */
export type DateShortcut = {
    label: string;
    /** ISO string to set, or `null` to clear the date. */
    resolve: () => string | null;
};

/** Noon, so a timezone shift can never move the stored day. */
function atNoon(date: Date): string {
    const value = new Date(date);
    value.setHours(12, 0, 0, 0);
    return value.toISOString();
}

export const DATE_SHORTCUTS: DateShortcut[] = [
    { label: "Today", resolve: () => atNoon(new Date()) },
    { label: "Tomorrow", resolve: () => atNoon(addDays(new Date(), 1)) },
    { label: "Weekend", resolve: () => atNoon(nextSaturday(new Date())) },
    { label: "Month end", resolve: () => atNoon(endOfMonth(new Date())) },
];

/** The shortcuts plus the way out, for menus that need a "Clear" row. */
export const DATE_SHORTCUTS_WITH_CLEAR: DateShortcut[] = [
    ...DATE_SHORTCUTS,
    { label: "Clear", resolve: () => null },
];
