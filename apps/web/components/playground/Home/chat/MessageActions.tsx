"use client";

import { type ThreadMessage, to_plain_text } from "@trydarwin/types";
import { CopyIcon, DeleteIcon, EmojiReactionIcon, ReplyIcon } from "@trydarwin/ui/icons";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import EmojiPicker from "@/components/ui/EmojiPicker";
import { cn } from "@/lib/utils";

type AnyChat = ThreadMessage;

export function ActionButton({ className, ...props }: ComponentProps<typeof Button>) {
    return (
        <Button
            variant="unstyled"
            type="button"
            className={cn(
                "flex size-6 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-overlay/10 hover:text-neutral-100 disabled:cursor-default disabled:opacity-40 data-[state=open]:bg-overlay/10 data-[state=open]:text-neutral-100",
                className,
            )}
            {...props}
        />
    );
}

export default function MessageActions({
    chat,
    isMine,
    canDelete,
    reactionDisabled,
    onReply,
    onDelete,
    onReaction,
}: {
    chat: AnyChat;
    isMine: boolean;
    canDelete: boolean;
    reactionDisabled: boolean;
    onReply: (chat: AnyChat) => void;
    onDelete: (chat: AnyChat) => void;
    onReaction: (chat: AnyChat, emoji: string) => void;
}) {
    return (
        <div
            className={cn(
                "surface-menu absolute -top-6 z-20 flex items-center gap-px rounded-lg p-0.5 text-neutral-100 opacity-0 transition-opacity group-hover/message:opacity-100 focus-within:opacity-100 has-data-[state=open]:opacity-100",
                isMine ? "right-1" : "left-1",
            )}
        >
            <EmojiPicker
                align={isMine ? "start" : "end"}
                onSelect={(emoji) => onReaction(chat, emoji)}
            >
                <ActionButton aria-label="Add reaction" disabled={reactionDisabled}>
                    <EmojiReactionIcon className="size-3.5" />
                </ActionButton>
            </EmojiPicker>
            <ActionButton aria-label="Reply" onClick={() => onReply(chat)}>
                <ReplyIcon className="size-3.5" />
            </ActionButton>
            <ActionButton
                aria-label="Copy message"
                onClick={() =>
                    navigator.clipboard.writeText(to_plain_text(chat.message, chat.references))
                }
            >
                <CopyIcon className="size-3" />
            </ActionButton>
            {canDelete && (
                <ActionButton
                    aria-label="Delete message"
                    onClick={() => onDelete(chat)}
                    className="hover:bg-danger-surface hover:text-danger"
                >
                    <DeleteIcon className="size-3.5" />
                </ActionButton>
            )}
        </div>
    );
}
