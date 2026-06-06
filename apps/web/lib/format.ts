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

/** Turn an organization name into a url-safe slug, e.g. "Acme Labs" -> "acme-labs". */
export function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
