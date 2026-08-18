function levenshtein(a: string, b: string): number {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const dist = Array.from({ length: rows }, (_, i) => [i, ...new Array(cols - 1).fill(0)]);
    for (let j = 0; j < cols; j++) dist[0][j] = j;

    for (let i = 1; i < rows; i++) {
        for (let j = 1; j < cols; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dist[i][j] = Math.min(
                dist[i - 1][j] + 1,
                dist[i][j - 1] + 1,
                dist[i - 1][j - 1] + cost,
            );
        }
    }

    return dist[rows - 1][cols - 1];
}

export function similarity(query: string, candidate: string): number {
    const a = query.trim().toLowerCase();
    const b = candidate.trim().toLowerCase();
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (b.includes(a) || a.includes(b)) return 0.85;

    const distance = levenshtein(a, b);
    return Math.max(0, 1 - distance / Math.max(a.length, b.length));
}

export type FuzzyMatch<T> = { item: T; score: number };
export type Labeled<T> = { item: T; label: string };

export function best_matches<T>(
    query: string,
    candidates: Labeled<T>[],
    limit = 3,
): FuzzyMatch<T>[] {
    return candidates
        .map((candidate) => ({ item: candidate.item, score: similarity(query, candidate.label) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
