"use client";

import { defaultRangeExtractor, useVirtualizer, type Range } from "@tanstack/react-virtual";
import {
    createContext,
    useCallback,
    useContext,
    useLayoutEffect,
    useRef,
    useState,
    type FocusEvent,
} from "react";
import { cn } from "@/lib/utils";
import { activeStickyRowIndex, preservePrependScrollTop } from "./virtualizedIssueRows";
import { useAutomaticPageLoading, useStickyHeaderPush } from "./useVirtualizedRows";
import type { PrependAnchorCapture, VirtualizedRowsProps } from "./virtualizedRows.type";

const VIRTUAL_OVERSCAN = 6;

const PrependAnchorContext = createContext<PrependAnchorCapture | null>(null);

export function useVirtualizedPrependAnchor() {
    return useContext(PrependAnchorContext);
}

function focusIssue(element: HTMLDivElement, issueId: string) {
    const issue = Array.from(element.querySelectorAll<HTMLElement>("[data-issue-id]")).find(
        (candidate) => candidate.dataset.issueId === issueId,
    );
    const focusTarget = issue?.matches("button, [role=button]")
        ? issue
        : issue?.querySelector<HTMLElement>("button, [role=button]");
    focusTarget?.focus({ preventScroll: true });
}

export function VirtualizedRows<T>({
    rows,
    getRowKey,
    renderRow,
    estimateSize,
    gap = 0,
    className,
    contentClassName,
    scrollElementRef,
    findIssueRow,
    status,
    autoFill,
    emptyState,
    footer,
    contentRole,
    dataColumnList,
    pinnedIssueId,
    stickyRowIndexes = [],
    prependAnchorRef,
}: VirtualizedRowsProps<T>) {
    "use no memo";

    const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
    const [focusedIssueId, setFocusedIssueId] = useState<string | null>(null);
    const prependSnapshotRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
    const activeStickyRowRef = useRef(-1);
    const focusedRow = focusedIssueId && findIssueRow ? findIssueRow(focusedIssueId) : -1;
    const pinnedRow = pinnedIssueId && findIssueRow ? findIssueRow(pinnedIssueId) : -1;
    const setScroller = useCallback(
        (element: HTMLDivElement | null) => {
            setScrollElement(element);
            scrollElementRef?.(element);
        },
        [scrollElementRef],
    );
    const rangeExtractor = useCallback(
        (range: Range) => {
            const indexes = defaultRangeExtractor(range);
            activeStickyRowRef.current = activeStickyRowIndex(stickyRowIndexes, range.startIndex);
            const activeStickyPosition = stickyRowIndexes.indexOf(activeStickyRowRef.current);
            const nextStickyRow = stickyRowIndexes[activeStickyPosition + 1] ?? -1;
            const pinnedIndexes = new Set(
                [focusedRow, pinnedRow, activeStickyRowRef.current, nextStickyRow].filter(
                    (index) => index >= 0 && !indexes.includes(index),
                ),
            );
            return [...indexes, ...pinnedIndexes].sort((left, right) => left - right);
        },
        [focusedRow, pinnedRow, stickyRowIndexes],
    );
    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollElement,
        estimateSize: () => estimateSize,
        getItemKey: (index) => getRowKey(rows[index]),
        measureElement: (element) => element.getBoundingClientRect().height,
        overscan: VIRTUAL_OVERSCAN,
        gap,
        rangeExtractor,
    });
    const virtualRows = virtualizer.getVirtualItems();
    const contentSize = virtualizer.getTotalSize();
    const activeStickyIndex = activeStickyRowRef.current;
    useStickyHeaderPush(scrollElement, activeStickyIndex, 0, contentSize);
    const capturePrependAnchor = useCallback(() => {
        if (!scrollElement) return undefined;
        const snapshot = {
            scrollTop: scrollElement.scrollTop,
            scrollHeight: scrollElement.scrollHeight,
        };
        prependSnapshotRef.current = snapshot;
        return () => {
            if (prependSnapshotRef.current === snapshot) prependSnapshotRef.current = null;
        };
    }, [scrollElement]);

    useAutomaticPageLoading(
        scrollElement,
        contentSize,
        rows.length,
        autoFill,
        capturePrependAnchor,
    );

    useLayoutEffect(() => {
        if (!prependAnchorRef) return;
        prependAnchorRef.current = capturePrependAnchor;
        return () => {
            prependAnchorRef.current = null;
        };
    }, [capturePrependAnchor, prependAnchorRef]);

    useLayoutEffect(() => {
        const snapshot = prependSnapshotRef.current;
        if (!scrollElement || !snapshot) return;
        prependSnapshotRef.current = null;
        scrollElement.scrollTop = preservePrependScrollTop(
            snapshot.scrollTop,
            snapshot.scrollHeight,
            scrollElement.scrollHeight,
        );
    }, [rows.length, scrollElement]);

    useLayoutEffect(() => {
        if (!scrollElement || !focusedIssueId) return;
        if (focusedRow < 0) {
            scrollElement.focus({ preventScroll: true });
            return;
        }
        if (scrollElement.contains(document.activeElement)) return;
        focusIssue(scrollElement, focusedIssueId);
    }, [focusedIssueId, focusedRow, rows, scrollElement]);

    function handleFocus(event: FocusEvent<HTMLDivElement>) {
        const issue = (event.target as HTMLElement).closest<HTMLElement>("[data-issue-id]");
        if (issue?.dataset.issueId) setFocusedIssueId(issue.dataset.issueId);
    }

    function handleBlur(event: FocusEvent<HTMLDivElement>) {
        if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node))
            return;
        setFocusedIssueId(null);
    }

    return (
        <PrependAnchorContext.Provider value={capturePrependAnchor}>
            <div
                ref={setScroller}
                data-lenis-prevent
                data-column-list={dataColumnList}
                tabIndex={-1}
                onFocusCapture={handleFocus}
                onBlurCapture={handleBlur}
                className={cn("min-h-0 overflow-y-auto outline-none", className)}
            >
                <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                    {status.label}
                </div>
                <div
                    role={contentRole}
                    className={cn("relative w-full", contentClassName)}
                    style={{ height: contentSize }}
                >
                    {virtualRows.map((virtualRow) => {
                        const isActiveStickyRow = virtualRow.index === activeStickyRowRef.current;
                        return (
                            <div
                                key={virtualRow.key}
                                role={contentRole ? "presentation" : undefined}
                                ref={virtualizer.measureElement}
                                data-index={virtualRow.index}
                                data-sticky-row={
                                    stickyRowIndexes.includes(virtualRow.index) || undefined
                                }
                                className={cn(
                                    "top-0 left-0 w-full",
                                    isActiveStickyRow
                                        ? "sticky z-20 will-change-transform"
                                        : "absolute",
                                )}
                                style={
                                    isActiveStickyRow
                                        ? { top: 0 }
                                        : { transform: `translateY(${virtualRow.start}px)` }
                                }
                            >
                                {renderRow(rows[virtualRow.index], virtualRow.index)}
                            </div>
                        );
                    })}
                </div>
                {rows.length === 0 && emptyState}
                {footer}
            </div>
        </PrependAnchorContext.Provider>
    );
}
