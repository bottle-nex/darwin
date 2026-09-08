"use client";

import { defaultRangeExtractor, type Range, useVirtualizer } from "@tanstack/react-virtual";
import {
    type LabelledReference,
    ProjectRole,
    type ThreadMessage,
    to_plain_text,
} from "@trydarwin/types";
import { CloseIcon, CommentCountIcon } from "@trydarwin/ui/icons";
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
import { Button } from "@/components/ui/button";
import {
    CHAT_AUTO_FILL_PAGE_CAP,
    CHAT_VIRTUAL_OVERSCAN,
    type ChatQuoteDiscoveryResult,
    discoverChatQuote,
    preservePrependScrollTop,
    shouldPrefetchOlderHistory,
} from "@/hooks/chats/chatCache";
import { OPTIMISTIC_ID_PREFIX } from "@/hooks/chats/useChats";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import SessionServices from "@/lib/session";

import ChatComposer, { type ChatComposerHandle } from "./ChatComposer";
import ChatMessage from "./ChatMessage";

type QuoteNavigation = {
    targetId: string;
    status: ChatQuoteDiscoveryResult | "searching";
    loadedPages: number;
};

type ChatThreadProps = {
    chats: ThreadMessage[] | undefined;
    projectId: string | undefined;
    historyKey: string;
    placeholder?: string;
    emptyMessage: string;
    disabled?: boolean;
    loading?: boolean;
    initialError?: boolean;
    pageError?: boolean;
    fetchingOlder?: boolean;
    hasOlder?: boolean;
    pageCount?: number;
    canDeleteAny?: boolean;
    teamId?: string;
    onLoadOlder?: () => Promise<unknown>;
    onRetry?: () => Promise<unknown>;
    onSend: (message: string, references: LabelledReference[], repliedToId?: string) => void;
    onDelete: (chat: ThreadMessage) => void;
    onReaction: (chat: ThreadMessage, emoji: string) => void;
};

const NEAR_BOTTOM_DISTANCE = 96;
const IDENTIFY_DURATION_MS = 1200;

function findChatElement(element: HTMLElement, chatId: string) {
    return Array.from(element.querySelectorAll<HTMLElement>("[data-chat-id]")).find(
        (candidate) => candidate.dataset.chatId === chatId,
    );
}

function historyFetchFailed(result: unknown) {
    return Boolean(
        result && typeof result === "object" && "isError" in result && result.isError === true,
    );
}

export default function ChatThread({
    chats,
    projectId,
    historyKey,
    placeholder = "Leave a comment...",
    emptyMessage,
    disabled,
    loading,
    initialError,
    pageError,
    fetchingOlder,
    hasOlder,
    pageCount = 0,
    canDeleteAny,
    teamId,
    onLoadOlder,
    onRetry,
    onSend,
    onDelete,
    onReaction,
}: ChatThreadProps) {
    "use no memo";

    const [replyTo, setReplyTo] = useState<ThreadMessage | null>(null);
    const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
    const [focusedChatId, setFocusedChatId] = useState<string | null>(null);
    const [identifiedChatId, setIdentifiedChatId] = useState<string | null>(null);
    const [newMessageCount, setNewMessageCount] = useState(0);
    const [automaticPages, setAutomaticPages] = useState(0);
    const [historyAnnouncement, setHistoryAnnouncement] = useState("");
    const [quoteNavigation, setQuoteNavigation] = useState<QuoteNavigation | null>(null);
    const currentUserId = SessionServices.get_user()?.id;
    const { data: members } = useProjectMembers(canDeleteAny === undefined ? projectId : undefined);
    const viewerIsAdmin =
        members?.some(
            (member) => member.id === currentUserId && member.role === ProjectRole.Admin,
        ) ?? false;
    const viewerCanDeleteAny = canDeleteAny ?? viewerIsAdmin;
    const activeReplyTo =
        replyTo && !chats?.some((chat) => chat.id === replyTo.id && chat.isDeleted)
            ? replyTo
            : null;
    const composerRef = useRef<ChatComposerHandle>(null);
    const nearBottomRef = useRef(true);
    const initialScrollCompleteRef = useRef(false);
    const previousLastChatIdRef = useRef<string | undefined>(undefined);
    const prependSnapshotRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
    const previousPageCountRef = useRef(pageCount);
    const messagesRef = useRef(chats);
    const hasOlderRef = useRef(Boolean(hasOlder));
    const discoveryGenerationRef = useRef(0);
    const identifyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const historyAnnouncementTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const historyFetchInFlightRef = useRef(false);
    messagesRef.current = chats;
    hasOlderRef.current = Boolean(hasOlder);

    const chatIndexes = useMemo(() => {
        const indexes = new Map<string, number>();
        chats?.forEach((chat, index) => indexes.set(chat.id, index));
        return indexes;
    }, [chats]);
    const focusedIndex = focusedChatId ? (chatIndexes.get(focusedChatId) ?? -1) : -1;
    const identifiedIndex = identifiedChatId ? (chatIndexes.get(identifiedChatId) ?? -1) : -1;
    const rangeExtractor = useCallback(
        (range: Range) => {
            const indexes = defaultRangeExtractor(range);
            const pinned = [focusedIndex, identifiedIndex].filter(
                (index) => index >= 0 && !indexes.includes(index),
            );
            return [...indexes, ...pinned].sort((left, right) => left - right);
        },
        [focusedIndex, identifiedIndex],
    );
    const virtualizer = useVirtualizer({
        count: chats?.length ?? 0,
        getScrollElement: () => scrollElement,
        getItemKey: (index) => chats?.[index]?.id ?? index,
        estimateSize: () => 84,
        measureElement: (element) => element.getBoundingClientRect().height,
        overscan: CHAT_VIRTUAL_OVERSCAN,
        gap: 6,
        rangeExtractor,
    });
    virtualizer.shouldAdjustScrollPositionOnItemSizeChange = (item) =>
        item.start < (virtualizer.scrollOffset ?? 0);
    const virtualRows = virtualizer.getVirtualItems();
    const lastChat = chats?.at(-1);
    const lastChatId = lastChat?.id;

    const scrollToNewest = useCallback(() => {
        if (!chats?.length) return;
        virtualizer.scrollToIndex(chats.length - 1, { align: "end" });
        requestAnimationFrame(() => {
            if (!scrollElement) return;
            scrollElement.scrollTop = scrollElement.scrollHeight;
            nearBottomRef.current = true;
            setNewMessageCount(0);
        });
    }, [chats?.length, scrollElement, virtualizer]);

    const loadOlder = useCallback(async () => {
        if (
            !scrollElement ||
            !onLoadOlder ||
            !hasOlder ||
            fetchingOlder ||
            historyFetchInFlightRef.current
        ) {
            return;
        }
        historyFetchInFlightRef.current = true;
        prependSnapshotRef.current = {
            scrollTop: scrollElement.scrollTop,
            scrollHeight: scrollElement.scrollHeight,
        };
        try {
            return await onLoadOlder();
        } finally {
            historyFetchInFlightRef.current = false;
        }
    }, [fetchingOlder, hasOlder, onLoadOlder, scrollElement]);

    const revealChat = useCallback(
        (chatId: string) => {
            const index = messagesRef.current?.findIndex((chat) => chat.id === chatId) ?? -1;
            if (index < 0) return false;
            setIdentifiedChatId(chatId);
            virtualizer.scrollToIndex(index, { align: "center" });
            requestAnimationFrame(() => {
                if (!scrollElement) return;
                findChatElement(scrollElement, chatId)?.focus({ preventScroll: true });
            });
            if (identifyTimeoutRef.current) clearTimeout(identifyTimeoutRef.current);
            identifyTimeoutRef.current = setTimeout(() => {
                setIdentifiedChatId((current) => (current === chatId ? null : current));
            }, IDENTIFY_DURATION_MS);
            return true;
        },
        [scrollElement, virtualizer],
    );

    const navigateToQuote = useCallback(
        async (targetId: string) => {
            if (quoteNavigation?.targetId === targetId && quoteNavigation.status === "searching") {
                return;
            }
            if (revealChat(targetId)) {
                setQuoteNavigation({ targetId, status: "found", loadedPages: 0 });
                return;
            }

            const generation = discoveryGenerationRef.current + 1;
            discoveryGenerationRef.current = generation;
            setQuoteNavigation({ targetId, status: "searching", loadedPages: 0 });
            const result = await discoverChatQuote({
                targetId,
                getMessages: () => messagesRef.current ?? [],
                hasOlder: () => hasOlderRef.current,
                fetchOlder: async () => {
                    const result = await loadOlder();
                    if (historyFetchFailed(result)) throw new Error("History page failed");
                    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
                },
                isCurrent: () => discoveryGenerationRef.current === generation,
                onProgress: (loadedPages) => {
                    if (discoveryGenerationRef.current !== generation) return;
                    setQuoteNavigation({ targetId, status: "searching", loadedPages });
                },
            });
            if (discoveryGenerationRef.current !== generation || result === "cancelled") return;
            setQuoteNavigation((current) =>
                current?.targetId === targetId ? { ...current, status: result } : current,
            );
            if (result === "found") revealChat(targetId);
        },
        [loadOlder, quoteNavigation, revealChat],
    );

    useEffect(() => {
        return () => {
            discoveryGenerationRef.current += 1;
            if (identifyTimeoutRef.current) clearTimeout(identifyTimeoutRef.current);
            if (historyAnnouncementTimeoutRef.current) {
                clearTimeout(historyAnnouncementTimeoutRef.current);
            }
        };
    }, [historyKey]);

    useEffect(() => {
        if (replyTo) composerRef.current?.focus();
    }, [replyTo]);

    useLayoutEffect(() => {
        if (!scrollElement) return;
        const snapshot = prependSnapshotRef.current;
        if (snapshot && pageCount !== previousPageCountRef.current) {
            scrollElement.scrollTop = preservePrependScrollTop(
                snapshot.scrollTop,
                snapshot.scrollHeight,
                scrollElement.scrollHeight,
            );
            prependSnapshotRef.current = null;
            setHistoryAnnouncement("Older messages loaded.");
            if (historyAnnouncementTimeoutRef.current) {
                clearTimeout(historyAnnouncementTimeoutRef.current);
            }
            historyAnnouncementTimeoutRef.current = setTimeout(
                () => setHistoryAnnouncement(""),
                IDENTIFY_DURATION_MS,
            );
        }
        previousPageCountRef.current = pageCount;
    }, [pageCount, scrollElement]);

    useLayoutEffect(() => {
        if (!scrollElement || !lastChatId) return;
        if (!initialScrollCompleteRef.current) {
            initialScrollCompleteRef.current = true;
            previousLastChatIdRef.current = lastChatId;
            scrollToNewest();
            return;
        }
        if (previousLastChatIdRef.current === lastChatId) return;
        previousLastChatIdRef.current = lastChatId;
        const ownOptimistic =
            lastChat.id.startsWith(OPTIMISTIC_ID_PREFIX) && lastChat.senderId === currentUserId;
        if (ownOptimistic || nearBottomRef.current) {
            scrollToNewest();
        } else {
            setNewMessageCount((count) => count + 1);
        }
    }, [currentUserId, lastChat, lastChatId, scrollElement, scrollToNewest]);

    useEffect(() => {
        if (
            !scrollElement ||
            !hasOlder ||
            fetchingOlder ||
            pageError ||
            !onLoadOlder ||
            automaticPages >= CHAT_AUTO_FILL_PAGE_CAP
        ) {
            return;
        }
        const frame = requestAnimationFrame(() => {
            if (virtualizer.getTotalSize() > scrollElement.clientHeight + 1) return;
            setAutomaticPages((count) => count + 1);
            void loadOlder();
        });
        return () => cancelAnimationFrame(frame);
    }, [
        automaticPages,
        chats?.length,
        fetchingOlder,
        hasOlder,
        loadOlder,
        onLoadOlder,
        pageError,
        scrollElement,
        virtualizer,
    ]);

    function handleScroll() {
        if (!scrollElement) return;
        const distance =
            scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight;
        nearBottomRef.current = distance <= NEAR_BOTTOM_DISTANCE;
        if (nearBottomRef.current && newMessageCount > 0) setNewMessageCount(0);
        if (
            shouldPrefetchOlderHistory(scrollElement.scrollTop) &&
            hasOlder &&
            !fetchingOlder &&
            !pageError
        ) {
            void loadOlder();
        }
    }

    function handleFocus(event: FocusEvent<HTMLDivElement>) {
        const chat = (event.target as HTMLElement).closest<HTMLElement>("[data-chat-id]");
        if (chat?.dataset.chatId) setFocusedChatId(chat.dataset.chatId);
    }

    function handleBlur(event: FocusEvent<HTMLDivElement>) {
        if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node))
            return;
        setFocusedChatId(null);
    }

    function handleSend(message: string, references: LabelledReference[]) {
        onSend(message, references, activeReplyTo?.id);
        setReplyTo(null);
    }

    const liveStatus = loading
        ? "Loading messages."
        : initialError
          ? "Messages failed to load."
          : fetchingOlder
            ? "Loading older messages."
            : pageError
              ? "Older messages failed to load."
              : newMessageCount > 0
                ? `${newMessageCount} new ${newMessageCount === 1 ? "message" : "messages"}.`
                : historyAnnouncement
                  ? historyAnnouncement
                  : chats?.length === 0
                    ? emptyMessage
                    : "";
    const quoteStatus = quoteNavigation?.status;

    return (
        <>
            <div className="relative flex-1 min-h-0 min-w-0">
                <div
                    ref={setScrollElement}
                    data-lenis-prevent
                    tabIndex={-1}
                    onScroll={handleScroll}
                    onFocusCapture={handleFocus}
                    onBlurCapture={handleBlur}
                    className="no-scrollbar h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto text-[13px] text-neutral-500 font-open"
                >
                    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                        {liveStatus}
                    </div>
                    {loading ? (
                        <LogoLoader size={32} className="h-full" />
                    ) : initialError ? (
                        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                            <p>Messages couldn&apos;t be loaded.</p>
                            <Button
                                variant="tertiary"
                                type="button"
                                onClick={() => void onRetry?.()}
                            >
                                Retry
                            </Button>
                        </div>
                    ) : chats && chats.length > 0 ? (
                        <>
                            <div className="flex min-h-10 items-center justify-center py-2">
                                {fetchingOlder ? (
                                    <span>Loading older messages...</span>
                                ) : pageError ? (
                                    <Button
                                        variant="tertiary"
                                        type="button"
                                        onClick={() => void loadOlder()}
                                    >
                                        Retry older messages
                                    </Button>
                                ) : !hasOlder ? (
                                    <span className="text-[11px] text-neutral-600">
                                        Start of history
                                    </span>
                                ) : null}
                            </div>
                            {quoteNavigation && quoteStatus !== "found" ? (
                                <div className="sticky top-0 z-20 mx-2 flex items-center justify-between gap-3 rounded-md border border-white/10 bg-charcoal px-3 py-2 text-[12px] text-neutral-300">
                                    <span>
                                        {quoteStatus === "searching"
                                            ? `Searching older messages (${quoteNavigation.loadedPages}/5)...`
                                            : quoteStatus === "retryable-error"
                                              ? "Search paused because an older page failed."
                                              : quoteStatus === "window-exhausted"
                                                ? "Five pages searched. Continue when ready."
                                                : "The quoted message is no longer available in history."}
                                    </span>
                                    {quoteStatus === "retryable-error" ||
                                    quoteStatus === "window-exhausted" ? (
                                        <Button
                                            variant="tertiary"
                                            type="button"
                                            onClick={() =>
                                                void navigateToQuote(quoteNavigation.targetId)
                                            }
                                        >
                                            {quoteStatus === "retryable-error"
                                                ? "Retry"
                                                : "Continue"}
                                        </Button>
                                    ) : null}
                                </div>
                            ) : null}
                            <div
                                role="list"
                                className="relative min-w-0"
                                style={{ height: virtualizer.getTotalSize() }}
                            >
                                {virtualRows.map((virtualRow) => {
                                    const chat = chats[virtualRow.index];
                                    return (
                                        <div
                                            key={virtualRow.key}
                                            ref={virtualizer.measureElement}
                                            data-index={virtualRow.index}
                                            role="presentation"
                                            className="absolute top-0 left-0 w-full"
                                            style={{
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                        >
                                            <ChatMessage
                                                chat={chat}
                                                isMine={
                                                    Boolean(currentUserId) &&
                                                    chat.senderId === currentUserId
                                                }
                                                startsGroup={
                                                    chats[virtualRow.index - 1]?.senderId !==
                                                    chat.senderId
                                                }
                                                endsGroup={
                                                    chats[virtualRow.index + 1]?.senderId !==
                                                    chat.senderId
                                                }
                                                viewerId={currentUserId ?? undefined}
                                                canDelete={
                                                    Boolean(currentUserId) &&
                                                    !chat.id.startsWith(OPTIMISTIC_ID_PREFIX) &&
                                                    !chat.isDeleted &&
                                                    (chat.senderId === currentUserId ||
                                                        viewerCanDeleteAny)
                                                }
                                                position={virtualRow.index + 1}
                                                setSize={hasOlder ? undefined : chats.length}
                                                identified={identifiedChatId === chat.id}
                                                searchingQuoteId={
                                                    quoteStatus === "searching"
                                                        ? quoteNavigation?.targetId
                                                        : undefined
                                                }
                                                onReply={setReplyTo}
                                                onDelete={onDelete}
                                                onQuoteClick={(chatId) =>
                                                    void navigateToQuote(chatId)
                                                }
                                                onReaction={onReaction}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-y-3 text-center">
                            <span
                                className="flex size-11 items-center justify-center rounded-2xl bg-charcoal text-neutral-500 ring-1 ring-white/10"
                                aria-hidden
                            >
                                <CommentCountIcon className="size-5" />
                            </span>
                            <p className="text-[13px] text-neutral-500">{emptyMessage}</p>
                        </div>
                    )}
                </div>
                {newMessageCount > 0 ? (
                    <Button
                        variant="tertiary"
                        type="button"
                        onClick={scrollToNewest}
                        className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2"
                    >
                        {newMessageCount} new {newMessageCount === 1 ? "message" : "messages"}
                    </Button>
                ) : null}
            </div>
            <footer className="relative flex min-w-0 flex-col">
                <ChatComposer
                    ref={composerRef}
                    projectId={projectId}
                    placeholder={placeholder}
                    disabled={disabled}
                    teamId={teamId}
                    onSend={handleSend}
                >
                    {activeReplyTo ? (
                        <div className="flex items-center gap-x-2.5 border-b border-white/6 px-2.5 py-2">
                            <span
                                className="w-px shrink-0 self-stretch rounded-full bg-neutral-600"
                                aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                                <span className="block text-[11px] leading-4 font-medium text-neutral-300">
                                    Replying to{" "}
                                    {activeReplyTo.senderId === currentUserId
                                        ? "yourself"
                                        : (activeReplyTo.sender?.name ?? "Unknown")}
                                </span>
                                <span className="block truncate text-[12px] leading-4 text-neutral-500">
                                    {to_plain_text(
                                        activeReplyTo.message,
                                        activeReplyTo.references ?? [],
                                    )}
                                </span>
                            </div>
                            <Button
                                variant="unstyled"
                                type="button"
                                onClick={() => setReplyTo(null)}
                                aria-label="Cancel reply"
                                className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-white/6 hover:text-neutral-200"
                            >
                                <CloseIcon className="size-3.5" />
                            </Button>
                        </div>
                    ) : null}
                </ChatComposer>
            </footer>
        </>
    );
}
