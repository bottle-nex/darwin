const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60, unit: "second" },
    { amount: 60, unit: "minute" },
    { amount: 24, unit: "hour" },
    { amount: 7, unit: "day" },
    { amount: 4.34524, unit: "week" },
    { amount: 12, unit: "month" },
    { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** Compact relative time, e.g. "3 days ago", "2 months ago". */
export function formatRelativeTime(date: string | Date): string {
    const value = typeof date === "string" ? new Date(date) : date;
    let duration = (value.getTime() - Date.now()) / 1000;

    for (const division of DIVISIONS) {
        if (Math.abs(duration) < division.amount) {
            return rtf.format(Math.round(duration), division.unit);
        }
        duration /= division.amount;
    }

    return rtf.format(Math.round(duration), "year");
}

/** Absolute date, e.g. "Jan 10, 2025". */
export function formatDate(date: string | Date): string {
    const value = typeof date === "string" ? new Date(date) : date;
    return value.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function ordinalSuffix(day: number): string {
    if (day % 100 >= 11 && day % 100 <= 13) return "th";
    if (day % 10 === 1) return "st";
    if (day % 10 === 2) return "nd";
    if (day % 10 === 3) return "rd";
    return "th";
}

/** Day-level date without the year, e.g. "Jan 10th". */
export function shortDate(date: string | Date): string {
    const value = typeof date === "string" ? new Date(date) : date;
    const day = value.getDate();
    return `${value.toLocaleDateString([], { month: "short" })} ${day}${ordinalSuffix(day)}`;
}

/**
 * How an issue is named everywhere it is shown: the project's first three letters,
 * uppercased, then the number — "trydarwin" issue 42 reads `TRY-42`.
 *
 * Punctuation and spaces are stripped before slicing, so "My App" keys as `MYA`
 * rather than `MY ` with a trailing space. Some callers hand this an already
 * `#`-prefixed number, so that prefix is dropped rather than doubled.
 */
export function issueIdentifier(projectName: string | undefined, number: number | string): string {
    const key = (projectName ?? "")
        .replace(/[^a-z0-9]/gi, "")
        .slice(0, 3)
        .toUpperCase();
    return `${key || "ISS"}-${String(number).replace(/^#/, "")}`;
}

/** Turn an organization name into a url-safe slug, e.g. "Acme Labs" -> "acme-labs". */
export function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
