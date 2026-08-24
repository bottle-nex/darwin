"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { shouldPrefetchNextIssuePage, stickyHeaderPushOffset } from "./virtualizedIssueRows";
import type { AutoFillOptions, PrependAnchorCapture } from "./virtualizedRows.type";

const AUTO_FILL_PAGE_CAP = 3;

const FAILED_PAGE_COOLDOWN_MS = 3000;

export function useStickyHeaderPush(
    element: HTMLDivElement | null,
    activeStickyIndex: number,
    stickyTopInset: number,
    contentSize: number,
) {
    useLayoutEffect(() => {
        if (!element || activeStickyIndex < 0) return;
        let frame = 0;

        const update = () => {
            frame = 0;
            const activeHeader = element.querySelector<HTMLElement>(
                `[data-index="${activeStickyIndex}"]`,
            );
            if (!activeHeader) return;
            const nextHeader = Array.from(
                element.querySelectorAll<HTMLElement>("[data-sticky-row='true']"),
            )
                .filter((header) => Number(header.dataset.index) > activeStickyIndex)
                .sort((left, right) => Number(left.dataset.index) - Number(right.dataset.index))[0];
            const stickyTop = element.getBoundingClientRect().top + stickyTopInset;
            const pushOffset = nextHeader
                ? stickyHeaderPushOffset(
                      nextHeader.getBoundingClientRect().top,
                      stickyTop,
                      activeHeader.offsetHeight,
                  )
                : 0;
            activeHeader.style.transform = `translate3d(0, ${pushOffset}px, 0)`;
        };
        const schedule = () => {
            if (frame) return;
            frame = requestAnimationFrame(update);
        };
        const resizeObserver = new ResizeObserver(schedule);
        resizeObserver.observe(element);
        element.addEventListener("scroll", schedule, { passive: true });
        schedule();

        return () => {
            element.removeEventListener("scroll", schedule);
            resizeObserver.disconnect();
            if (frame) cancelAnimationFrame(frame);
        };
    }, [activeStickyIndex, contentSize, element, stickyTopInset]);
}

export function useAutomaticPageLoading(
    element: HTMLDivElement | null,
    contentSize: number,
    rowCount: number,
    options: AutoFillOptions | undefined,
    capturePrependAnchor: PrependAnchorCapture,
) {
    const automaticPages = useRef(0);
    const fetchInFlight = useRef(false);
    const lastAttemptAt = useRef(0);

    useEffect(() => {
        automaticPages.current = 0;
    }, [options?.key]);

    const loadMore = useCallback(() => {
        if (
            !options ||
            !options.hasNextPage ||
            options.fetchingNextPage ||
            options.paused ||
            fetchInFlight.current
        ) {
            return false;
        }
        if (options.pageError && Date.now() - lastAttemptAt.current < FAILED_PAGE_COOLDOWN_MS) {
            return false;
        }
        lastAttemptAt.current = Date.now();
        fetchInFlight.current = true;
        const clearPrependAnchor = options.preservePrepend ? capturePrependAnchor() : undefined;
        void Promise.resolve(options.onLoadMore()).finally(() => {
            fetchInFlight.current = false;
            clearPrependAnchor?.();
        });
        return true;
    }, [capturePrependAnchor, options]);

    useEffect(() => {
        if (
            !element ||
            !options ||
            !options.hasNextPage ||
            options.fetchingNextPage ||
            options.paused ||
            automaticPages.current >= AUTO_FILL_PAGE_CAP
        ) {
            return;
        }

        const frame = requestAnimationFrame(() => {
            if (contentSize > element.clientHeight + 1) return;
            if (loadMore()) automaticPages.current += 1;
        });
        return () => cancelAnimationFrame(frame);
    }, [contentSize, element, loadMore, options, rowCount]);

    useEffect(() => {
        if (!element || !options) return;
        const prefetchNearBoundary = () => {
            if (
                shouldPrefetchNextIssuePage(
                    element.scrollHeight,
                    element.scrollTop,
                    element.clientHeight,
                )
            ) {
                loadMore();
            }
        };
        element.addEventListener("scroll", prefetchNearBoundary, { passive: true });
        return () => element.removeEventListener("scroll", prefetchNearBoundary);
    }, [element, loadMore, options]);
}
