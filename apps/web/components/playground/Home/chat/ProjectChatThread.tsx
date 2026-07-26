"use client";
import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";
import { IoIosSend, IoMdClose } from "react-icons/io";
import { MdChat } from "react-icons/md";
import { ProjectRole, type Chat, type ProjectChat } from "@trymatcha/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import SessionServices from "@/lib/session";
import { useProjectMembers, type ProjectMember } from "@/hooks/project/useProjectMembers";
import { OPTIMISTIC_ID_PREFIX } from "@/hooks/chats/useChats";
import LogoLoader from "@/components/app/LogoLoader";
import ChatMessage from "./ChatMessage";

/** Matches an "@query" being typed at the caret (start of text or after whitespace). */
const MENTION_AT_CARET = /(?:^|\s)@([^\s@]*)$/;

/** Tiny debounce so the mention search doesn't fire on every keystroke. */
function useDebouncedValue<T>(value: T, delayMs: number) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(id);
    }, [value, delayMs]);
    return debounced;
}

type ChatThreadProps = {
    chats: (Chat | ProjectChat)[] | undefined;
    projectId: string | undefined;
    placeholder?: string;
    emptyMessage: string;
    /** True while the underlying conversation isn't ready to receive messages yet. */
    disabled?: boolean;
    /** True while the initial page of chats is still being fetched. */
    loading?: boolean;
    onSend: (message: string, mentionedMembers: ProjectMember[], repliedToId?: string) => void;
    onDelete: (chat: Chat | ProjectChat) => void;
};

/**
 * The scrollable message list + composer shared by every chat surface (issue
 * comments, project chat). Callers own the outer frame/header and pass a `key`
 * that changes with the conversation, so switching threads resets the draft.
 */
export default function ChatThread({
    chats,
    projectId,
    placeholder = "Leave a comment...",
    emptyMessage,
    disabled,
    loading,
    onSend,
    onDelete,
}: ChatThreadProps) {
    const [message, setMessage] = useState<string>("");
    const [replyTo, setReplyTo] = useState<Chat | ProjectChat | null>(null);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState<number>(0);
    // Members tagged in the draft, keyed by the "@Name " text that was inserted for
    // them — lets handleSend tell whether that mention is still in the message.
    const [mentionedMembers, setMentionedMembers] = useState<Map<string, ProjectMember>>(new Map());
    const currentUserId = SessionServices.get_user()?.id;
    const { data: members } = useProjectMembers(projectId);
    const viewerIsAdmin =
        members?.some((m) => m.id === currentUserId && m.role === ProjectRole.Admin) ?? false;
    const activeReplyTo =
        replyTo && !chats?.some((c) => c.id === replyTo.id && c.isDeleted) ? replyTo : null;
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Composing a mention: search the project's members server-side (capped,
    // debounced) instead of loading the whole project roster into the browser.
    const isComposingMention = mentionQuery !== null;
    const debouncedMentionQuery = useDebouncedValue(mentionQuery, 200);
    const { data: mentionResults } = useProjectMembers(
        isComposingMention ? projectId : undefined,
        debouncedMentionQuery ?? "",
    );
    const mentionMatches = isComposingMention ? (mentionResults ?? []) : [];

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
        if (replyTo) {
            inputRef.current?.focus();
        }
    }, [replyTo]);

    /** Re-derive the mention popup from the text before the caret. */
    function syncMention(value: string, caret: number) {
        const match = MENTION_AT_CARET.exec(value.slice(0, caret));
        setMentionQuery(match ? match[1] : null);
        setMentionIndex(0);
    }

    /** Replace the "@query" before the caret with "@Name " and remember who was tagged. */
    function insertMention(member: ProjectMember) {
        const el = inputRef.current;
        if (!el) return;
        const caret = el.selectionStart;
        const before = message
            .slice(0, caret)
            .replace(MENTION_AT_CARET, (m) => (m.startsWith("@") ? "" : m[0]));
        const mentionText = `@${member.name ?? member.email}`;
        const inserted = `${before}${mentionText} `;
        setMessage(inserted + message.slice(caret));
        setMentionQuery(null);
        setMentionedMembers((prev) => new Map(prev).set(mentionText, member));
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(inserted.length, inserted.length);
        });
    }

    function handleSend() {
        const trimmed = message.trim();
        if (!trimmed || disabled) return;
        // Only keep mentions whose "@Name " text is still present — covers the
        // case where the tag was inserted then edited or deleted before sending.
        const stillTagged = Array.from(mentionedMembers.entries())
            .filter(([mentionText]) => trimmed.includes(mentionText))
            .map(([, member]) => member);
        onSend(trimmed, stillTagged, activeReplyTo?.id);
        setMessage("");
        setReplyTo(null);
        setMentionedMembers(new Map());
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
                                    (chat.senderId === currentUserId || viewerIsAdmin)
                                }
                                onReply={setReplyTo}
                                onDelete={onDelete}
                                onQuoteClick={jumpToChat}
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
            <footer className="relative flex flex-col">
                {mentionMatches.length > 0 && (
                    <ul className="absolute w-50 bottom-full left-4 right-4 z-10 max-h-48 overflow-y-auto rounded-[10px] border border-white/10 bg-neutral-900 p-1 shadow-lg">
                        {mentionMatches.map((member, i) => (
                            <li key={member.id}>
                                <Button
                                    variant="unstyled"
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
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="rounded-lg bg-[#1a1a1a] shadow-[inset_0_1px_0_0_#262626]">
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
                                    {activeReplyTo.message}
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
                    <div className="relative">
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
                                if (e.key === "Escape" && activeReplyTo) {
                                    setReplyTo(null);
                                    return;
                                }
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            disabled={disabled}
                            className="no-scrollbar min-h-9.5 max-h-28 w-full resize-none overflow-y-auto bg-transparent py-1.75 pr-11 text-[13px] leading-5 text-neutral-100 shadow-none hover:bg-transparent placeholder:text-[13px]!"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSend}
                            disabled={disabled || !message.trim()}
                            aria-label="Send message"
                            className="absolute bottom-0.75 right-1.5 h-8! w-8! text-neutral-400 hover:bg-transparent hover:text-neutral-100 disabled:text-neutral-600"
                        >
                            <IoIosSend className="size-5.5" />
                        </Button>
                    </div>
                </div>
            </footer>
        </>
    );
}
