export function formatDate(date: string | Date): string {
    const value = typeof date === "string" ? new Date(date) : date;
    return value.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
