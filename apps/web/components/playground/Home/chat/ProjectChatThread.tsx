"use client";
import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";
import { IoMdClose } from "react-icons/io";
import { MdChat } from "react-icons/md";
import {
    ProjectRole,
    to_plain_text,
    type LabelledReference,
    type ThreadMessage,
} from "@trymatcha/types";
import { Button } from "@/components/ui/button";
import SessionServices from "@/lib/session";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { OPTIMISTIC_ID_PREFIX } from "@/hooks/chats/useChats";
import LogoLoader from "@/components/app/LogoLoader";
import ChatMessage from "./ChatMessage";
import ChatComposer, { type ChatComposerHandle } from "./ChatComposer";

type ChatThreadProps = {
    chats: ThreadMessage[] | undefined;
    projectId: string | undefined;
    placeholder?: string;
    emptyMessage: string;
    /** True while the underlying conversation isn't ready to receive messages yet. */
    disabled?: boolean;
    /** True while the initial page of chats is still being fetched. */
    loading?: boolean;
    canDeleteAny?: boolean;
    memberUserIds?: readonly string[];
    onSend: (message: string, references: LabelledReference[], repliedToId?: string) => void;
    onDelete: (chat: ThreadMessage) => void;
    onReaction: (chat: ThreadMessage, emoji: string) => void;
};

export default function ChatThread({
    chats,
    projectId,
    placeholder = "Leave a comment...",
    emptyMessage,
    disabled,
    loading,
    canDeleteAny,
    memberUserIds,
    onSend,
    onDelete,
    onReaction,
}: ChatThreadProps) {
    const [replyTo, setReplyTo] = useState<ThreadMessage | null>(null);
    const currentUserId = SessionServices.get_user()?.id;
    const { data: members } = useProjectMembers(canDeleteAny === undefined ? projectId : undefined);
    const viewerIsAdmin =
        members?.some((m) => m.id === currentUserId && m.role === ProjectRole.Admin) ?? false;
    const viewerCanDeleteAny = canDeleteAny ?? viewerIsAdmin;
    const activeReplyTo =
        replyTo && !chats?.some((c) => c.id === replyTo.id && c.isDeleted) ? replyTo : null;
    const scrollRef = useRef<HTMLDivElement>(null);
    const composerRef = useRef<ChatComposerHandle>(null);

    // Pin the thread to the newest message whenever the list grows.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        if (el.scrollTop === 0) {
            el.scrollTop = el.scrollHeight;
            return;
        }
        const animation = animate(el.scrollTop, el.scrollHeight - el.clientHeight, {
            duration: 0.6,
            ease: [0.25, 1, 0.35, 1],
            onUpdate: (top) => {
                el.scrollTop = top;
            },
        });
        return () => animation.stop();
    }, [chats?.length]);

    useEffect(() => {
        if (replyTo) composerRef.current?.focus();
    }, [replyTo]);

    function handleSend(message: string, references: LabelledReference[]) {
        onSend(message, references, activeReplyTo?.id);
        setReplyTo(null);
    }

    /** Scroll a quoted original into view and flash it briefly. */
    function jumpToChat(chatId: string) {
        const el = document.getElementById(`chat-${chatId}`);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("bg-white/10");
        setTimeout(() => el.classList.remove("bg-white/10"), 900);
    }

    return (
        <>
            <div
                ref={scrollRef}
                data-lenis-prevent
                className="no-scrollbar flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto text-[13px] text-neutral-500 font-open"
            >
                {loading ? (
                    <LogoLoader size={32} className="h-full" />
                ) : chats && chats.length > 0 ? (
                    <ul className="flex min-w-0 flex-col gap-y-px">
                        {chats.map((chat, i) => (
                            <ChatMessage
                                key={chat.id}
                                chat={chat}
                                isMine={Boolean(currentUserId) && chat.senderId === currentUserId}
                                startsGroup={chats[i - 1]?.senderId !== chat.senderId}
                                endsGroup={chats[i + 1]?.senderId !== chat.senderId}
                                viewerId={currentUserId ?? undefined}
                                canDelete={
                                    Boolean(currentUserId) &&
                                    !chat.id.startsWith(OPTIMISTIC_ID_PREFIX) &&
                                    !chat.isDeleted &&
                                    (chat.senderId === currentUserId || viewerCanDeleteAny)
                                }
                                onReply={setReplyTo}
                                onDelete={onDelete}
                                onQuoteClick={jumpToChat}
                                onReaction={onReaction}
                            />
                        ))}
                    </ul>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-y-3 text-center">
                        <span
                            className="flex size-11 items-center justify-center rounded-2xl bg-charcoal text-neutral-500 ring-1 ring-white/10"
                            aria-hidden
                        >
                            <MdChat className="size-5" />
                        </span>
                        <p className="text-[13px] text-neutral-500">{emptyMessage}</p>
                    </div>
                )}
            </div>
            <footer className="relative flex min-w-0 flex-col">
                <ChatComposer
                    ref={composerRef}
                    projectId={projectId}
                    placeholder={placeholder}
                    disabled={disabled}
                    memberUserIds={memberUserIds}
                    onSend={handleSend}
                >
                    {activeReplyTo && (
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
                                <IoMdClose className="size-3.5" />
                            </Button>
                        </div>
                    )}
                </ChatComposer>
            </footer>
        </>
    );
}
