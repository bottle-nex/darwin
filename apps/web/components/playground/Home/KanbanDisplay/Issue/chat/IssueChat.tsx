"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BsChatRightTextFill } from "react-icons/bs";
import { IoIosSend } from "react-icons/io";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SessionServices from "@/lib/session";
import { useChats } from "@/hooks/chats/useChats";
import { useCreateChat } from "@/hooks/chats/useCreateChat";
import ChatMessage from "./ChatMessage";

/** The "Comments and activity" panel for an issue. Disabled until the issue is saved. */
export default function IssueChat({ issueId }: { issueId?: string }) {
    const [message, setMessage] = useState<string>("");
    const { data: chats } = useChats(issueId);
    const createChat = useCreateChat(issueId);
    const currentUserId = SessionServices.get_user()?.id;
    const scrollRef = useRef<HTMLDivElement>(null);

    // Pin the thread to the newest comment whenever the list grows.
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [chats?.length]);

    async function handleSend() {
        const trimmed = message.trim();
        if (!trimmed || !issueId || createChat.isPending) return;
        try {
            await createChat.mutateAsync(trimmed);
            setMessage("");
        } catch {
            toast.error("Couldn't add your comment.");
        }
    }

    return (
        <section className="m-2.5 flex min-h-0 flex-1 flex-col rounded-[13px] bg-white/3 *:px-4 *:py-3">
            <header className="text-sm font-medium text-neutral-100 flex items-center gap-x-3">
                <BsChatRightTextFill />
                <span>Comments and activity</span>
            </header>
            <div
                ref={scrollRef}
                data-lenis-prevent
                className="no-scrollbar flex-1 min-h-0 overflow-y-auto text-[13px] text-neutral-500"
            >
                {chats && chats.length > 0 ? (
                    <ul className="flex flex-col">
                        {chats.map((chat, i) => (
                            <ChatMessage
                                key={chat.id}
                                chat={chat}
                                isMine={Boolean(currentUserId) && chat.senderId === currentUserId}
                                startsGroup={chats[i - 1]?.senderId !== chat.senderId}
                                endsGroup={chats[i + 1]?.senderId !== chat.senderId}
                            />
                        ))}
                    </ul>
                ) : (
                    <p className="text-[13px] text-neutral-600">
                        {issueId ? "No comments yet." : "Save the issue to start the conversation."}
                    </p>
                )}
            </div>
            <footer className="flex items-center gap-x-2">
                <Input
                    placeholder="Leave a comment..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    disabled={!issueId}
                    className="h-9 placeholder:text-[13px]!"
                />
                <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!issueId || !message.trim() || createChat.isPending}
                    aria-label="Send comment"
                >
                    <IoIosSend />
                </Button>
            </footer>
        </section>
    );
}
