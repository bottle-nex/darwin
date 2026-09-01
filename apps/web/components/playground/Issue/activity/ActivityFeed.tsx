"use client";
import { defaultRangeExtractor, type Range, useVirtualizer } from "@tanstack/react-virtual";
import { ActivityType, type Chat, to_plain_text } from "@trymatcha/types";
import {
    type FocusEvent,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import LogoLoader from "@/components/app/LogoLoader";
import ChatComposer from "@/components/playground/Home/chat/ChatComposer";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import {
    ACTIVITY_AUTO_FILL_PAGE_CAP,
    ACTIVITY_VIRTUAL_OVERSCAN,
    flattenActivityPages,
} from "@/hooks/activity/activityCache";
import { useActivity } from "@/hooks/activity/useActivity";
import { useIssueComments } from "@/hooks/chats/useIssueComments";

import {
    type ActivityFeedEntry,
    buildActivityFeedEntries,
    coordinateTimelineCoverage,
    preserveTimelineAnchor,
    selectLimitingTimelineStream,
    type TimelineStream,
} from "./activityFeedEntries";
import ActivityRow from "./ActivityRow";
import CommentCard from "./CommentCard";

const EXCERPT_LIMIT = 120;

function excerpt(comment: Chat) {
    const text = to_plain_text(comment.message, comment.references ?? []);
    return text.length > EXCERPT_LIMIT ? `${text.slice(0, EXCERPT_LIMIT).trimEnd()}...` : text;
}

/**
 * A row that carries its own agent-log box breaks the run the same way a comment does: the box
 * is full-width chrome sitting between two rows, so a connector reaching it would point at a
 * card rather than joining one activity to the next.
 */
function isRailed(entry: ActivityFeedEntry | undefined) {
    if (entry?.kind !== "activity") return false;
    const carriesLogs =
        entry.activity.type === ActivityType.RunStarted && Boolean(entry.activity.session);
    return !carriesLogs;
}

export default function ActivityFeed({
    issueId,
    scrollElement,
}: {
    issueId?: string;
    scrollElement: HTMLElement | null;
}) {
    "use no memo";

    const activityHistory = useActivity(issueId);
    const commentsHistory = useIssueComments(issueId);
    const [pendingDelete, setPendingDelete] = useState<Chat | null>(null);
    const [listElement, setListElement] = useState<HTMLDivElement | null>(null);
    const [scrollMargin, setScrollMargin] = useState(0);
    const [availableTimelineHeight, setAvailableTimelineHeight] = useState(0);
    const [focusedEntryKey, setFocusedEntryKey] = useState<string | null>(null);
    const [cycleBase, setCycleBase] = useState<Record<TimelineStream, number>>({
        activity: 0,
        comments: 0,
    });
    const [historyAnnouncement, setHistoryAnnouncement] = useState("");
    const loadingStreamRef = useRef<TimelineStream | null>(null);
    const prependSnapshotRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
    const previousPageCountRef = useRef(0);
    const previousEntryCountRef = useRef(0);
    const listOffsetRef = useRef(0);
    const announcementTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activities = useMemo(
        () => (activityHistory.data ? flattenActivityPages(activityHistory.data.pages) : []),
        [activityHistory.data],
    );
    const comments = useMemo(() => commentsHistory.comments ?? [], [commentsHistory.comments]);
    const activityHasOlder = Boolean(activityHistory.hasNextPage);
    const commentsHaveOlder = commentsHistory.hasOlder;
    const coverage = useMemo(
        () =>
            coordinateTimelineCoverage({
                activity: { items: activities, hasMore: activityHasOlder },
                comments: { items: comments, hasMore: commentsHaveOlder },
            }),
        [activities, activityHasOlder, comments, commentsHaveOlder],
    );
    const entries = useMemo(
        () => buildActivityFeedEntries(coverage.activities, coverage.comments),
        [coverage.activities, coverage.comments],
    );
    const pageCounts = {
        activity: activityHistory.data?.pages.length ?? 0,
        comments: commentsHistory.pages?.pages.length ?? 0,
    };
    const fetchedPagesInCycle = {
        activity: Math.max(0, pageCounts.activity - cycleBase.activity),
        comments: Math.max(0, pageCounts.comments - cycleBase.comments),
    };
    const nextAutomaticStream = selectLimitingTimelineStream(
        coverage,
        fetchedPagesInCycle,
        ACTIVITY_AUTO_FILL_PAGE_CAP,
    );
    const entryIndexes = useMemo(
        () => new Map(entries.map((entry, index) => [entry.key, index])),
        [entries],
    );
    const focusedIndex = focusedEntryKey ? (entryIndexes.get(focusedEntryKey) ?? -1) : -1;
    const rangeExtractor = useCallback(
        (range: Range) => {
            const indexes = defaultRangeExtractor(range);
            return focusedIndex >= 0 && !indexes.includes(focusedIndex)
                ? [...indexes, focusedIndex].sort((left, right) => left - right)
                : indexes;
        },
        [focusedIndex],
    );
    const virtualizer = useVirtualizer({
        count: entries.length,
        getScrollElement: () => scrollElement,
        getItemKey: (index) => entries[index]?.key ?? index,
        estimateSize: (index) => (entries[index]?.kind === "activity" ? 30 : 150),
        measureElement: (element) => element.getBoundingClientRect().height,
        overscan: ACTIVITY_VIRTUAL_OVERSCAN,
        scrollMargin,
        rangeExtractor,
    });
    virtualizer.shouldAdjustScrollPositionOnItemSizeChange = (item) =>
        item.start < (virtualizer.scrollOffset ?? 0);
    const virtualRows = virtualizer.getVirtualItems();
    const virtualContentHeight = virtualizer.getTotalSize();
    const totalPageCount = pageCounts.activity + pageCounts.comments;
    const initialLoading = activityHistory.isLoading || commentsHistory.isLoading;
    const activityInitialError = activityHistory.isError && !activityHistory.data;
    const commentsInitialError = commentsHistory.isInitialError;
    const initialError = activityInitialError || commentsInitialError;
    const activityPageError = activityHistory.isFetchNextPageError;
    const commentsPageError = commentsHistory.isPageError;
    const fetchingActivity = activityHistory.isFetchingNextPage;
    const fetchingComments = commentsHistory.isFetchingOlder;
    const fetchingOlder = fetchingActivity || fetchingComments;
    const anyOlder = activityHasOlder || commentsHaveOlder;
    const historyExhausted = !activityHasOlder && !commentsHaveOlder;
    const capped =
        Boolean(activityHistory.data && commentsHistory.pages) &&
        coverage.watermark !== null &&
        anyOlder &&
        !nextAutomaticStream;
    const fetchActivityPage = activityHistory.fetchNextPage;
    const fetchCommentsPage = commentsHistory.fetchOlder;

    const loadStream = useCallback(
        async (stream: TimelineStream) => {
            if (loadingStreamRef.current || !scrollElement) return;
            if (stream === "activity" && !activityHasOlder) return;
            if (stream === "comments" && !commentsHaveOlder) return;
            loadingStreamRef.current = stream;
            prependSnapshotRef.current = {
                scrollTop: scrollElement.scrollTop,
                scrollHeight: scrollElement.scrollHeight,
            };
            try {
                if (stream === "activity") await fetchActivityPage();
                else await fetchCommentsPage();
            } finally {
                loadingStreamRef.current = null;
            }
        },
        [activityHasOlder, commentsHaveOlder, fetchActivityPage, fetchCommentsPage, scrollElement],
    );

    useLayoutEffect(() => {
        if (!listElement || !scrollElement) return;
        const updateAvailableHeight = () => {
            const nextHeight = Math.max(
                0,
                Math.min(
                    scrollElement.clientHeight,
                    scrollElement.scrollTop + scrollElement.clientHeight - listOffsetRef.current,
                ),
            );
            setAvailableTimelineHeight((current) =>
                current === nextHeight ? current : nextHeight,
            );
        };
        const measureLayout = () => {
            const listTop = listElement.getBoundingClientRect().top;
            const scrollTop = scrollElement.getBoundingClientRect().top;
            const listOffset = listTop - scrollTop + scrollElement.scrollTop;
            listOffsetRef.current = listOffset;
            setScrollMargin((current) => (current === listOffset ? current : listOffset));
            updateAvailableHeight();
        };
        measureLayout();
        const observer = new ResizeObserver(measureLayout);
        observer.observe(scrollElement);
        if (listElement.parentElement) observer.observe(listElement.parentElement);
        if (listElement.parentElement?.parentElement) {
            observer.observe(listElement.parentElement.parentElement);
        }
        scrollElement.addEventListener("scroll", updateAvailableHeight, { passive: true });
        window.addEventListener("resize", measureLayout);
        return () => {
            observer.disconnect();
            scrollElement.removeEventListener("scroll", updateAvailableHeight);
            window.removeEventListener("resize", measureLayout);
        };
    }, [listElement, scrollElement]);

    useLayoutEffect(() => {
        if (!scrollElement || totalPageCount === previousPageCountRef.current) return;
        const previousPageCount = previousPageCountRef.current;
        previousPageCountRef.current = totalPageCount;
        if (previousPageCount === 0) return;
        const snapshot = prependSnapshotRef.current;
        if (snapshot) {
            scrollElement.scrollTop = preserveTimelineAnchor(
                snapshot.scrollTop,
                snapshot.scrollHeight,
                scrollElement.scrollHeight,
            );
            prependSnapshotRef.current = null;
        }
        const newlyPublished = Math.max(0, entries.length - previousEntryCountRef.current);
        if (newlyPublished > 0) {
            setHistoryAnnouncement(
                `${newlyPublished} older timeline ${newlyPublished === 1 ? "entry" : "entries"} loaded.`,
            );
            if (announcementTimeoutRef.current) clearTimeout(announcementTimeoutRef.current);
            announcementTimeoutRef.current = setTimeout(() => setHistoryAnnouncement(""), 1800);
        }
    }, [entries.length, scrollElement, totalPageCount]);

    useEffect(() => {
        previousEntryCountRef.current = entries.length;
    }, [entries.length]);

    useEffect(() => {
        if (
            initialLoading ||
            initialError ||
            fetchingOlder ||
            activityPageError ||
            commentsPageError ||
            !nextAutomaticStream ||
            (entries.length > 0 &&
                (availableTimelineHeight === 0 ||
                    virtualContentHeight > availableTimelineHeight + 1))
        ) {
            return;
        }
        void loadStream(nextAutomaticStream);
    }, [
        activityPageError,
        availableTimelineHeight,
        commentsPageError,
        entries.length,
        fetchingOlder,
        initialError,
        initialLoading,
        loadStream,
        nextAutomaticStream,
        virtualContentHeight,
    ]);

    useEffect(() => {
        setCycleBase({ activity: 0, comments: 0 });
        previousPageCountRef.current = 0;
        previousEntryCountRef.current = 0;
        prependSnapshotRef.current = null;
        setHistoryAnnouncement("");
    }, [issueId]);

    useEffect(
        () => () => {
            if (announcementTimeoutRef.current) clearTimeout(announcementTimeoutRef.current);
        },
        [],
    );

    function handleFocus(event: FocusEvent<HTMLDivElement>) {
        const entry = (event.target as HTMLElement).closest<HTMLElement>("[data-timeline-entry]");
        if (entry?.dataset.timelineEntry) setFocusedEntryKey(entry.dataset.timelineEntry);
    }

    function handleBlur(event: FocusEvent<HTMLDivElement>) {
        if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node))
            return;
        setFocusedEntryKey(null);
    }

    function confirmDelete() {
        if (!pendingDelete) return;
        commentsHistory.remove(pendingDelete);
        setPendingDelete(null);
    }

    function continueHistory() {
        setCycleBase(pageCounts);
    }

    const initialErrorLabel =
        activityInitialError && commentsInitialError
            ? "Activity and comments couldn't be loaded."
            : activityInitialError
              ? "Activity couldn't be loaded."
              : "Comments couldn't be loaded.";
    const pageErrorLabel =
        activityPageError && commentsPageError
            ? "Older activity and comments failed to load."
            : activityPageError
              ? "Older activity failed to load."
              : commentsPageError
                ? "Older comments failed to load."
                : "";
    const loadOlder = capped
        ? continueHistory
        : nextAutomaticStream
          ? () => void loadStream(nextAutomaticStream)
          : null;
    const liveStatus = initialLoading
        ? "Loading issue timeline."
        : initialError
          ? initialErrorLabel
          : fetchingActivity
            ? "Loading older activity."
            : fetchingComments
              ? "Loading older comments."
              : pageErrorLabel
                ? pageErrorLabel
                : historyAnnouncement
                  ? historyAnnouncement
                  : capped
                    ? "Automatic timeline loading paused."
                    : historyExhausted
                      ? "All issue history is loaded."
                      : entries.length === 0
                        ? "No jointly covered timeline entries yet."
                        : "";

    return (
        <section className="flex min-w-0 flex-col gap-y-3 pt-2">
            <h2 className="text-[13px] font-medium text-neutral-400">Activity</h2>
            <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                {liveStatus}
            </div>
            {initialLoading ? (
                <LogoLoader size={28} className="py-6" />
            ) : initialError ? (
                <div className="flex flex-col items-start gap-2 py-4 text-[13px] text-neutral-500">
                    <p>{initialErrorLabel}</p>
                    <div className="flex gap-2">
                        {activityInitialError && (
                            <Button
                                type="button"
                                variant="tertiary"
                                onClick={() => void activityHistory.refetch()}
                            >
                                Retry activity
                            </Button>
                        )}
                        {commentsInitialError && (
                            <Button
                                type="button"
                                variant="tertiary"
                                onClick={() => void commentsHistory.retry()}
                            >
                                Retry comments
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-2 text-[12px] text-neutral-500 empty:hidden">
                        {fetchingOlder ? (
                            <LogoLoader size={18} className="py-1.5" />
                        ) : pageErrorLabel ? (
                            <>
                                <span>{pageErrorLabel}</span>
                                {activityPageError && (
                                    <Button
                                        type="button"
                                        variant="tertiary"
                                        onClick={() => void loadStream("activity")}
                                    >
                                        Retry activity
                                    </Button>
                                )}
                                {commentsPageError && (
                                    <Button
                                        type="button"
                                        variant="tertiary"
                                        onClick={() => void loadStream("comments")}
                                    >
                                        Retry comments
                                    </Button>
                                )}
                            </>
                        ) : loadOlder ? (
                            <Button type="button" variant="tertiary" onClick={loadOlder}>
                                Load older
                            </Button>
                        ) : null}
                    </div>
                    {entries.length === 0 ? (
                        <p className="py-4 text-[13px] text-neutral-500">
                            {historyExhausted
                                ? issueId
                                    ? "Nothing here yet."
                                    : "Save the issue to start its timeline."
                                : "Loading enough history to publish a complete interval."}
                        </p>
                    ) : (
                        <div
                            ref={setListElement}
                            role="list"
                            onFocusCapture={handleFocus}
                            onBlurCapture={handleBlur}
                            className="relative min-w-0"
                            style={{ height: virtualContentHeight }}
                        >
                            {virtualRows.map((virtualRow) => {
                                const entry = entries[virtualRow.index];
                                const rail = {
                                    above: isRailed(entries[virtualRow.index - 1]),
                                    below: isRailed(entries[virtualRow.index + 1]),
                                };
                                return (
                                    <div
                                        key={entry.key}
                                        ref={virtualizer.measureElement}
                                        role="listitem"
                                        aria-posinset={virtualRow.index + 1}
                                        aria-setsize={historyExhausted ? entries.length : undefined}
                                        data-index={virtualRow.index}
                                        data-timeline-entry={entry.key}
                                        className="absolute top-0 left-0 w-full"
                                        style={{
                                            transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                                        }}
                                    >
                                        {entry.kind === "comment" ? (
                                            <CommentCard
                                                thread={entry.thread}
                                                projectId={commentsHistory.projectId}
                                                onReply={commentsHistory.send}
                                                onDelete={setPendingDelete}
                                                onReaction={commentsHistory.react}
                                                canDelete={commentsHistory.canDelete}
                                            />
                                        ) : (
                                            <ActivityRow activity={entry.activity} rail={rail} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
            <div className="pt-1">
                <ChatComposer
                    key={issueId ?? "unsaved"}
                    projectId={commentsHistory.projectId}
                    placeholder={
                        issueId ? "Leave a comment..." : "Save the issue to start the conversation."
                    }
                    disabled={!issueId}
                    onSend={commentsHistory.send}
                />
            </div>
            <ConfirmDialog
                open={Boolean(pendingDelete)}
                onOpenChange={(next) => !next && setPendingDelete(null)}
                title="Delete comment?"
                description={
                    <>
                        This removes{" "}
                        <span className="font-medium text-neutral-200">
                            &ldquo;{pendingDelete ? excerpt(pendingDelete) : ""}&rdquo;
                        </span>{" "}
                        from the timeline. You can&apos;t undo this.
                    </>
                }
                cancel={{
                    label: "Cancel",
                    variant: "tertiary",
                    onClick: () => setPendingDelete(null),
                }}
                confirm={{ label: "Delete", variant: "destructive", onClick: confirmDelete }}
            />
        </section>
    );
}
