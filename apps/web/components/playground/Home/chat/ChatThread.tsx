"use client";
import { useEffect, useRef, useState } from "react";
import { IoIosSend, IoMdClose } from "react-icons/io";
import type { Chat, ProjectChat } from "@trymatcha/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import SessionServices from "@/lib/session";
import { type ProjectMember } from "@/hooks/project/useProjectMembers";
import ChatMessage from "./ChatMessage";

/** Matches an "@query" being typed at the caret (start of text or after whitespace). */
const MENTION_AT_CARET = /(?:^|\s)@([^\s@]*)$/;

type ChatThreadProps = {
    chats: (Chat | ProjectChat)[] | undefined;
    members: ProjectMember[] | undefined;
    placeholder?: string;
    emptyMessage: string;
    /** True while the underlying conversation isn't ready to receive messages yet. */
    disabled?: boolean;
    onSend: (message: string, repliedToId?: string) => void;
};

/**
 * The scrollable message list + composer shared by every chat surface (issue
 * comments, project chat). Callers own the outer frame/header and pass a `key`
 * that changes with the conversation, so switching threads resets the draft.
 */
export default function ChatThread({
    chats,
    members,
    placeholder = "Leave a comment...",
    emptyMessage,
    disabled,
    onSend,
}: ChatThreadProps) {
    const [message, setMessage] = useState<string>("");
    const [replyTo, setReplyTo] = useState<Chat | ProjectChat | null>(null);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState<number>(0);
    const currentUserId = SessionServices.get_user()?.id;
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Pin the thread to the newest message whenever the list grows.
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [chats?.length]);

    const mentionMatches =
        mentionQuery === null
            ? []
            : (members ?? []).filter((m) =>
                  (m.name ?? m.email).toLowerCase().includes(mentionQuery.toLowerCase()),
              );

    /** Re-derive the mention popup from the text before the caret. */
    function syncMention(value: string, caret: number) {
        const match = MENTION_AT_CARET.exec(value.slice(0, caret));
        setMentionQuery(match ? match[1] : null);
        setMentionIndex(0);
    }

    /** Replace the "@query" before the caret with "@Name " and refocus. */
    function insertMention(member: ProjectMember) {
        const el = inputRef.current;
        if (!el) return;
        const caret = el.selectionStart;
        const before = message
            .slice(0, caret)
            .replace(MENTION_AT_CARET, (m) => (m.startsWith("@") ? "" : m[0]));
        const inserted = `${before}@${member.name ?? member.email} `;
        setMessage(inserted + message.slice(caret));
        setMentionQuery(null);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(inserted.length, inserted.length);
        });
    }

    function handleSend() {
        const trimmed = message.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed, replyTo?.id);
        setMessage("");
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
                className="no-scrollbar flex-1 min-h-0 min-w-0 overflow-y-auto text-[13px] text-neutral-500"
            >
                {chats && chats.length > 0 ? (
                    <ul className="flex min-w-0 flex-col">
                        {chats.map((chat, i) => (
                            <ChatMessage
                                key={chat.id}
                                chat={chat}
                                isMine={Boolean(currentUserId) && chat.senderId === currentUserId}
                                startsGroup={chats[i - 1]?.senderId !== chat.senderId}
                                endsGroup={chats[i + 1]?.senderId !== chat.senderId}
                                mentionNames={(members ?? []).map((m) => m.name ?? m.email)}
                                viewerId={currentUserId ?? undefined}
                                onReply={setReplyTo}
                                onQuoteClick={jumpToChat}
                            />
                        ))}
                    </ul>
                ) : (
                    <p className="text-[13px] text-neutral-600">{emptyMessage}</p>
                )}
            </div>
            <footer className="relative flex flex-col">
                {mentionMatches.length > 0 && (
                    <ul className="absolute w-50 bottom-full left-4 right-4 z-10 max-h-48 overflow-y-auto rounded-[10px] border border-white/10 bg-neutral-900 p-1 shadow-lg">
                        {mentionMatches.map((member, i) => (
                            <li key={member.id}>
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        insertMention(member);
                                    }}
                                    onMouseEnter={() => setMentionIndex(i)}
                                    className={`flex w-full items-center gap-x-2.5 px-3 py-1.5 text-left text-[13px] text-neutral-200 rounded-sm ${
                                        i === mentionIndex ? "bg-white/8" : ""
                                    }`}
                                >
                                    <PlaygroundAvatar
                                        letter={(member.name ?? member.email)
                                            .charAt(0)
                                            .toUpperCase()}
                                        src={member.image ?? undefined}
                                        tone={toneFor(member.id)}
                                        size="md"
                                        className="rounded-full"
                                    />
                                    <span className="truncate">{member.name ?? member.email}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {replyTo && (
                    <div className="mb-1.5 flex items-center gap-x-2 rounded-[9px] border-l-2 border-indigo-400 bg-white/4 px-2.5 py-1.5">
                        <div className="min-w-0 flex-1">
                            <span className="block text-[11px] font-medium text-indigo-300">
                                Replying to{" "}
                                {replyTo.senderId === currentUserId
                                    ? "yourself"
                                    : (replyTo.sender?.name ?? "Unknown")}
                            </span>
                            <span className="block truncate text-[12px] text-neutral-400">
                                {replyTo.message}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setReplyTo(null)}
                            aria-label="Cancel reply"
                            className="shrink-0 rounded p-1 text-neutral-400 hover:text-neutral-100"
                        >
                            <IoMdClose className="size-4" />
                        </button>
                    </div>
                )}
                <div className="flex items-end gap-x-2">
                    <Textarea
                        ref={inputRef}
                        placeholder={placeholder}
                        value={message}
                        rows={1}
                        data-lenis-prevent
                        onChange={(e) => {
                            setMessage(e.target.value);
                            syncMention(e.target.value, e.target.selectionStart);
                        }}
                        onKeyDown={(e) => {
                            if (mentionMatches.length > 0) {
                                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                                    e.preventDefault();
                                    const step = e.key === "ArrowDown" ? 1 : -1;
                                    setMentionIndex(
                                        (mentionIndex + step + mentionMatches.length) %
                                            mentionMatches.length,
                                    );
                                    return;
                                }
                                if (e.key === "Enter" || e.key === "Tab") {
                                    e.preventDefault();
                                    insertMention(mentionMatches[mentionIndex]);
                                    return;
                                }
                                if (e.key === "Escape") {
                                    setMentionQuery(null);
                                    return;
                                }
                            }
                            if (e.key === "Escape" && replyTo) {
                                setReplyTo(null);
                                return;
                            }
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        disabled={disabled}
                        className="no-scrollbar min-h-8 max-h-28 min-w-0 flex-1 resize-none overflow-y-auto border-neutral-500 py-1.75 text-[13px] leading-5 text-neutral-100 placeholder:text-[13px]!"
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={disabled || !message.trim()}
                        aria-label="Send message"
                        className="shrink-0 h-9! w-9!"
                    >
                        <IoIosSend className="size-4.5" />
                    </Button>
                </div>
            </footer>
        </>
    );
}
