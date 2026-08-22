"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type MutableRefObject,
    type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { chunkIssueRows, loadedIssueSelectionIds } from "./virtualizedIssueRows";
import { VirtualizedRows, useVirtualizedPrependAnchor } from "./VirtualizedRows";
import type { AutoFillOptions, PrependAnchorCapture, VirtualStatus } from "./virtualizedRows.type";

export { VirtualizedRows, useVirtualizedPrependAnchor };

type VirtualizedIssueCardsProps<T extends { id: string }> = {
    items: T[];
    renderItem: (item: T, index: number) => ReactNode;
    knownTotal?: number;
    columns?: number | "responsive";
    estimateSize?: number;
    className?: string;
    rowClassName?: string;
    scrollElementRef?: (element: HTMLDivElement | null) => void;
    emptyState?: ReactNode;
    footer?: ReactNode;
    status: VirtualStatus;
    autoFill?: AutoFillOptions;
    dataColumnList?: string;
    pinnedIssueId?: string | null;
    prependAnchorRef?: MutableRefObject<PrependAnchorCapture | null>;
};

function useResponsiveColumns(element: HTMLDivElement | null, responsive: boolean) {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        if (!element || !responsive) return;
        const updateWidth = () => setWidth(element.clientWidth);
        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        observer.observe(element);
        return () => observer.disconnect();
    }, [element, responsive]);

    if (!responsive) return 1;
    if (width >= 1280) return 4;
    if (width >= 1024) return 3;
    if (width >= 640) return 2;
    return 1;
}

export default function VirtualizedIssueCards<T extends { id: string }>({
    items,
    renderItem,
    knownTotal,
    columns = 1,
    estimateSize = 176,
    className,
    rowClassName,
    scrollElementRef,
    emptyState,
    footer,
    status,
    autoFill,
    dataColumnList,
    pinnedIssueId,
    prependAnchorRef,
}: VirtualizedIssueCardsProps<T>) {
    const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
    const responsiveColumns = useResponsiveColumns(scrollElement, columns === "responsive");
    const columnCount = columns === "responsive" ? responsiveColumns : Math.max(1, columns);
    const issueIds = useMemo(() => loadedIssueSelectionIds(items, (item) => item.id), [items]);
    const issueIndexes = useMemo(
        () => new Map(issueIds.map((issueId, index) => [issueId, index])),
        [issueIds],
    );
    const rows = useMemo(
        () => chunkIssueRows(items, columnCount, (item) => item.id),
        [columnCount, items],
    );
    const rowIndexes = useMemo(() => {
        const indexes = new Map<string, number>();
        rows.forEach((row, rowIndex) => {
            row.itemKeys.forEach((issueId) => indexes.set(issueId, rowIndex));
        });
        return indexes;
    }, [rows]);
    const positionOffset = knownTotal ? Math.max(0, knownTotal - items.length) : 0;
    const setScroller = useCallback(
        (element: HTMLDivElement | null) => {
            setScrollElement(element);
            scrollElementRef?.(element);
        },
        [scrollElementRef],
    );

    return (
        <VirtualizedRows
            rows={rows}
            getRowKey={(row) => row.key}
            estimateSize={estimateSize}
            gap={8}
            className={className}
            scrollElementRef={setScroller}
            findIssueRow={(issueId) => rowIndexes.get(issueId) ?? -1}
            status={status}
            autoFill={autoFill}
            emptyState={emptyState}
            footer={footer}
            contentRole="list"
            dataColumnList={dataColumnList}
            pinnedIssueId={pinnedIssueId}
            prependAnchorRef={prependAnchorRef}
            renderRow={(row) => (
                <div
                    role="presentation"
                    className={cn("grid gap-2", rowClassName)}
                    style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
                >
                    {row.items.map((item) => {
                        const issueIndex = issueIndexes.get(item.id) ?? 0;
                        return (
                            <div
                                key={item.id}
                                role="listitem"
                                aria-posinset={positionOffset + issueIndex + 1}
                                aria-setsize={knownTotal}
                            >
                                {renderItem(item, issueIndex)}
                            </div>
                        );
                    })}
                </div>
            )}
        />
    );
}
