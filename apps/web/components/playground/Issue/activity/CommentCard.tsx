"use client";
import { useRef } from "react";
import { MdContentCopy } from "react-icons/md";
import { HiOutlineTrash } from "react-icons/hi";
import { HiOutlineFaceSmile } from "react-icons/hi2";
import { BsReply } from "react-icons/bs";
import { to_plain_text, type Chat, type LabelledReference } from "@trymatcha/types";
import { formatRelativeTime } from "@/lib/format";
import EmojiPicker from "@/components/ui/EmojiPicker";
import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import MessageBody from "@/components/playground/Home/chat/MessageBody";
import MessageReactions from "@/components/playground/Home/chat/MessageReactions";
import { ActionButton } from "@/components/playground/Home/chat/MessageActions";
import ChatComposer, {
    type ChatComposerHandle,
} from "@/components/playground/Home/chat/ChatComposer";
import { OPTIMISTIC_ID_PREFIX } from "@/hooks/chats/useChats";
import { useReactionPending } from "@/hooks/chats/useMessageReactions";

export type CommentThread = { root: Chat; replies: Chat[] };

type CommentHandlers = {
    onReply: (message: string, references: LabelledReference[], repliedToId: string) => void;
    onDelete: (comment: Chat) => void;
    onReaction: (comment: Chat, emoji: string) => void;
    canDelete: (comment: Chat) => boolean;
};

function senderName(comment: Chat): string {
    return comment.sender?.name ?? "Unknown";
}

function CommentAvatar({ comment, size }: { comment: Chat; size: "md" | "lg" }) {
    const name = senderName(comment);
    return (
        <PlaygroundAvatar
            letter={name.charAt(0).toUpperCase()}
            src={comment.sender?.image ?? undefined}
            tone={toneFor(comment.senderId ?? name)}
            size={size}
            className="rounded-full"
        />
    );
}

function CommentActions({
    comment,
    canDelete,
    reactionDisabled,
    onReplyClick,
    onDelete,
    onReaction,
}: {
    comment: Chat;
    canDelete: boolean;
    reactionDisabled: boolean;
    onReplyClick: () => void;
    onDelete: (comment: Chat) => void;
    onReaction: (comment: Chat, emoji: string) => void;
}) {
    return (
        <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-px rounded-lg border border-graphite/50 bg-charcoal p-0.5 opacity-0 shadow-lg transition-opacity group-hover/comment:opacity-100 focus-within:opacity-100 has-data-[state=open]:opacity-100">
            <EmojiPicker align="end" onSelect={(emoji) => onReaction(comment, emoji)}>
                <ActionButton aria-label="Add reaction" disabled={reactionDisabled}>
                    <HiOutlineFaceSmile className="size-3.5" />
                </ActionButton>
            </EmojiPicker>
            <ActionButton aria-label="Reply" onClick={onReplyClick}>
                <BsReply className="size-3.5" />
            </ActionButton>
            <ActionButton
                aria-label="Copy comment"
                onClick={() =>
                    navigator.clipboard.writeText(
                        to_plain_text(comment.message, comment.references),
                    )
                }
            >
                <MdContentCopy className="size-3" />
            </ActionButton>
            {canDelete && (
                <ActionButton
                    aria-label="Delete comment"
                    onClick={() => onDelete(comment)}
                    className="hover:bg-destructive/20 hover:text-destructive"
                >
                    <HiOutlineTrash className="size-3.5" />
                </ActionButton>
            )}
        </div>
    );
}

function CommentContent({
    comment,
    avatarSize,
    onReplyClick,
    onDelete,
    onReaction,
    canDelete,
}: {
    comment: Chat;
    avatarSize: "md" | "lg";
} & Pick<CommentHandlers, "onDelete" | "onReaction" | "canDelete"> & {
        onReplyClick: () => void;
    }) {
    const at = new Date(comment.createdAt);
    const reactionDisabled =
        useReactionPending(comment.id) || comment.id.startsWith(OPTIMISTIC_ID_PREFIX);

    return (
        <article className="group/comment relative px-3 py-2.5">
            {!comment.isDeleted && (
                <CommentActions
                    comment={comment}
                    canDelete={canDelete(comment)}
                    reactionDisabled={reactionDisabled}
                    onReplyClick={onReplyClick}
                    onDelete={onDelete}
                    onReaction={onReaction}
                />
            )}
            <header className="flex items-center gap-x-2">
                <CommentAvatar comment={comment} size={avatarSize} />
                <span className="text-[13px] font-medium text-neutral-200">
                    {senderName(comment)}
                </span>
                <time
                    dateTime={at.toISOString()}
                    title={at.toLocaleString()}
                    className="text-[11px] whitespace-nowrap text-neutral-600"
                >
                    {formatRelativeTime(at)}
                </time>
            </header>
            <div className="mt-1.5 pl-7 text-[13px] leading-[21px] wrap-anywhere text-neutral-300">
                {comment.isDeleted ? (
                    <span className="text-neutral-600 italic">Comment deleted</span>
                ) : (
                    <MessageBody
                        text={comment.message}
                        references={comment.references}
                        isMine={false}
                    />
                )}
            </div>
            {!comment.isDeleted && (
                <MessageReactions
                    reactions={comment.reactions ?? []}
                    isMine={false}
                    disabled={reactionDisabled}
                    className="pl-7"
                    onReact={(emoji) => onReaction(comment, emoji)}
                />
            )}
        </article>
    );
}

export default function CommentCard({
    thread,
    projectId,
    onReply,
    onDelete,
    onReaction,
    canDelete,
}: { thread: CommentThread; projectId: string | undefined } & CommentHandlers) {
    const composerRef = useRef<ChatComposerHandle>(null);
    const { root, replies } = thread;

    function focusComposer() {
        composerRef.current?.focus();
    }

    function handleSend(message: string, references: LabelledReference[]) {
        onReply(message, references, root.id);
    }

    return (
        <li className="my-3 overflow-hidden rounded-[8px] border border-white/8 bg-white/[0.02]">
            <CommentContent
                comment={root}
                avatarSize="lg"
                onReplyClick={focusComposer}
                onDelete={onDelete}
                onReaction={onReaction}
                canDelete={canDelete}
            />
            {replies.length > 0 && (
                <ul className="border-t border-white/6">
                    {replies.map((reply) => (
                        <li key={reply.id} className="not-first:border-t border-white/6">
                            <CommentContent
                                comment={reply}
                                avatarSize="md"
                                onReplyClick={focusComposer}
                                onDelete={onDelete}
                                onReaction={onReaction}
                                canDelete={canDelete}
                            />
                        </li>
                    ))}
                </ul>
            )}
            <div className="border-t border-white/6">
                <ChatComposer
                    ref={composerRef}
                    projectId={projectId}
                    placeholder="Leave a reply..."
                    className="rounded-none bg-transparent shadow-none"
                    onSend={handleSend}
                />
            </div>
        </li>
    );
}
