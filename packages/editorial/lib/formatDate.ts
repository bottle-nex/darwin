const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
});

export function formatDate(value: string | null) {
    if (!value) return "";
    return formatter.format(new Date(value));
}
