export type ChunkedIssueRow<T> = {
    key: string;
    items: T[];
    itemKeys: string[];
};

export type GroupedIssueRow<T, G> =
    | { kind: "group"; key: string; group: G }
    | { kind: "issue"; key: string; issue: T; group: G }
    | { kind: "group-end"; key: string; group: G };

type GroupIssue<G> = G extends { issues: (infer T)[] } ? T : never;

export function chunkIssueRows<T>(
    items: T[],
    columns: number,
    getItemKey: (item: T) => string,
): ChunkedIssueRow<T>[] {
    const width = Math.max(1, Math.floor(columns));
    const rows: ChunkedIssueRow<T>[] = [];

    for (let index = 0; index < items.length; index += width) {
        const rowItems = items.slice(index, index + width);
        const itemKeys = rowItems.map(getItemKey);
        rows.push({
            key: `row:${itemKeys.join(":")}`,
            items: rowItems,
            itemKeys,
        });
    }

    return rows;
}

export function flattenGroupedIssueRows<G extends { key: string; issues: unknown[] }>(
    groups: G[],
    getIssueKey: (issue: GroupIssue<G>) => string,
    includeGroupEnd = false,
    collapsedGroupKeys: ReadonlySet<string> = new Set(),
): GroupedIssueRow<GroupIssue<G>, G>[] {
    const rows: GroupedIssueRow<GroupIssue<G>, G>[] = [];

    for (const group of groups) {
        rows.push({ kind: "group", key: `group:${group.key}`, group });
        if (collapsedGroupKeys.has(group.key)) continue;
        for (const issue of group.issues as GroupIssue<G>[]) {
            rows.push({ kind: "issue", key: `issue:${getIssueKey(issue)}`, issue, group });
        }
        if (includeGroupEnd) {
            rows.push({ kind: "group-end", key: `group-end:${group.key}`, group });
        }
    }

    return rows;
}

export function loadedIssueSelectionIds<T>(
    issues: T[],
    getIssueKey: (issue: T) => string,
): string[] {
    const ids: string[] = [];
    const seen = new Set<string>();

    for (const issue of issues) {
        const id = getIssueKey(issue);
        if (seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
    }

    return ids;
}

export function preservePrependScrollTop(
    scrollTop: number,
    previousScrollHeight: number,
    nextScrollHeight: number,
) {
    return scrollTop + Math.max(0, nextScrollHeight - previousScrollHeight);
}

export function shouldPrefetchNextIssuePage(
    scrollHeight: number,
    scrollTop: number,
    clientHeight: number,
    threshold = 780,
) {
    return scrollHeight - scrollTop - clientHeight <= threshold;
}

export function activeStickyRowIndex(stickyIndexes: number[], visibleStartIndex: number) {
    for (let index = stickyIndexes.length - 1; index >= 0; index -= 1) {
        if (stickyIndexes[index] <= visibleStartIndex) return stickyIndexes[index];
    }
    return -1;
}

export function stickyHeaderPushOffset(
    nextHeaderStart: number,
    scrollOffset: number,
    headerSize: number,
) {
    return Math.max(-headerSize, Math.min(0, nextHeaderStart - scrollOffset - headerSize));
}
