"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BsChatRightTextFill } from "react-icons/bs";
import { IoIosSend } from "react-icons/io";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import SessionServices from "@/lib/session";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useProjectMembers, type ProjectMember } from "@/hooks/project/useProjectMembers";
import { useChats } from "@/hooks/chats/useChats";
import { send_socket_message } from "@/socket/singleton.socket";
import { InboundSocketMessageType } from "@trymatcha/types";
import ChatMessage from "./ChatMessage";

/** Matches an "@query" being typed at the caret (start of text or after whitespace). */
const MENTION_AT_CARET = /(?:^|\s)@([^\s@]*)$/;

/** The "Comments and activity" panel for an issue. Disabled until the issue is saved. */
export default function IssueChat({ issueId }: { issueId?: string }) {
    const [message, setMessage] = useState<string>("");
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState<number>(0);
    const { data: chats } = useChats(issueId);
    const { data: members } = useProjectMembers(useActiveProject()?.id);
    const currentUserId = SessionServices.get_user()?.id;
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Pin the thread to the newest comment whenever the list grows.
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

    /**
     * Sends the comment over the project socket; it shows up in the list when
     * the CHAT_CREATED broadcast comes back (CHAT_ERROR surfaces via toast).
     */
    function handleSend() {
        const trimmed = message.trim();
        if (!trimmed || !issueId) return;
        const sent = send_socket_message({
            type: InboundSocketMessageType.CHAT_CREATE,
            payload: { issueId, message: trimmed },
        });
        if (!sent) {
            toast.error("Couldn't add your comment.");
            return;
        }
        setMessage("");
    }

    return (
        <section className="m-2.5 flex min-h-0 min-w-0 flex-1 flex-col rounded-[13px] bg-white/3 *:px-4 *:py-3">
            <header className="text-sm font-medium text-neutral-100 flex items-center gap-x-3">
                <BsChatRightTextFill />
                <span>Comments and activity</span>
            </header>
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
                            />
                        ))}
                    </ul>
                ) : (
                    <p className="text-[13px] text-neutral-600">
                        {issueId ? "No comments yet." : "Save the issue to start the conversation."}
                    </p>
                )}
            </div>
            <footer className="relative flex items-end gap-x-2">
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
                <Textarea
                    ref={inputRef}
                    placeholder="Leave a comment..."
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
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    disabled={!issueId}
                    className="no-scrollbar min-h-8 max-h-28 min-w-0 flex-1 resize-none overflow-y-auto border-neutral-500 py-1.75 text-[13px] leading-5 text-neutral-100 placeholder:text-[13px]!"
                />
                <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!issueId || !message.trim()}
                    aria-label="Send comment"
                    className="shrink-0 h-9! w-9!"
                >
                    <IoIosSend className="size-4.5" />
                </Button>
            </footer>
        </section>
    );
}
