import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { HiChevronDown } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import PlaygroundAvatar, {
    toneFor,
    type AvatarTone,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import {
    reference_issues,
    to_plain_text,
    type Chat,
    type ProjectChat,
    type ReferencedIssueLabel,
} from "@trymatcha/types";
import MessageBody from "./MessageBody";
import IssueReferenceCard from "./IssueReferenceCard";
import MessageActions from "./MessageActions";
import MessageReactions from "./MessageReactions";
import { OPTIMISTIC_ID_PREFIX } from "@/hooks/chats/useChats";
import { useReactionPending } from "@/hooks/chats/useMessageReactions";

type AnyChat = Chat | ProjectChat;

const NAME_TONE_TEXT: Record<AvatarTone, string> = {
    indigo: "text-indigo-300",
    purple: "text-violet-300",
    blue: "text-sky-300",
    emerald: "text-emerald-300",
    dark: "text-neutral-300",
};

const NAME_TONE_RULE: Record<AvatarTone, string> = {
    indigo: "bg-indigo-400",
    purple: "bg-violet-400",
    blue: "bg-sky-400",
    emerald: "bg-emerald-400",
    dark: "bg-neutral-400",
};

function senderName(chat: AnyChat): string {
    return chat.sender?.name ?? "Unknown";
}

function senderTone(chat: AnyChat): AvatarTone {
    return toneFor(chat.senderId ?? senderName(chat));
}

function senderToneText(chat: AnyChat): string {
    return NAME_TONE_TEXT[senderTone(chat)];
}

function QuotedMessage({
    quote,
    isMine,
    viewerId,
    onQuoteClick,
}: {
    quote: AnyChat | null | undefined;
    isMine: boolean;
    viewerId?: string;
    onQuoteClick: (chatId: string) => void;
}) {
    const readable = quote && !quote.isDeleted;
    return (
        <Button
            variant="unstyled"
            type="button"
            onClick={() => readable && onQuoteClick(quote.id)}
            className={cn(
                "mb-1.5 flex w-full max-w-full items-stretch gap-x-2 overflow-hidden rounded-[4px] py-1.5 pr-2 text-left transition-colors",
                isMine ? "bg-black/15 hover:bg-black/25" : "bg-black/20 hover:bg-black/30",
                readable ? "cursor-pointer" : "cursor-default",
            )}
        >
            <span
                className={cn(
                    "w-0.5 shrink-0",
                    !readable
                        ? "bg-white/20"
                        : isMine
                          ? "bg-white/60"
                          : NAME_TONE_RULE[senderTone(quote)],
                )}
                aria-hidden
            />
            {readable ? (
                <span className="flex min-w-0 flex-1 flex-col">
                    <cite
                        className={cn(
                            "truncate text-[11px] leading-4 font-medium not-italic",
                            isMine ? "text-white" : senderToneText(quote),
                        )}
                    >
                        {viewerId && quote.senderId === viewerId ? "You" : senderName(quote)}
                    </cite>
                    <span
                        className={cn(
                            "line-clamp-2 wrap-anywhere text-[12px] leading-4",
                            isMine ? "text-white/65" : "text-neutral-400",
                        )}
                    >
                        {to_plain_text(quote.message, quote.references ?? [])}
                    </span>
                </span>
            ) : (
                <span
                    className={cn(
                        "min-w-0 flex-1 truncate text-[12px] leading-4",
                        isMine ? "text-white/55" : "text-neutral-500",
                    )}
                >
                    {quote?.isDeleted ? "Message deleted" : "Message unavailable"}
                </span>
            )}
        </Button>
    );
}

/** Roughly six lines of 13px/leading-snug text — the collapsed message height. */
const COLLAPSED_HEIGHT = 108;
const CLIP_LINE_LIMIT = 6;
/** Comfortably above what {@link COLLAPSED_HEIGHT} can hold, so a clipped
 *  message always really has something hidden behind "Show more". */
const CLIP_CHAR_LIMIT = 600;

const EXPAND_TRANSITION = { duration: 0.26, ease: [0.25, 1, 0.35, 1] } as const;

function isClippable(plainText: string): boolean {
    return plainText.length > CLIP_CHAR_LIMIT || plainText.split("\n").length > CLIP_LINE_LIMIT;
}

const TIME_TEXT = "text-[9px] leading-none tabular-nums";

function messageTimeLabel(sentAt: Date): string {
    return sentAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function MessageTime({
    isMine,
    sentAt,
    className,
}: {
    isMine: boolean;
    sentAt: Date;
    className?: string;
}) {
    return (
        <time
            dateTime={sentAt.toISOString()}
            className={cn(TIME_TEXT, isMine ? "text-white/50" : "text-neutral-500", className)}
        >
            {messageTimeLabel(sentAt)}
        </time>
    );
}

function taggedIssuesOf(chat: AnyChat): ReferencedIssueLabel[] {
    return [...reference_issues(chat.references ?? []).values()];
}

function IssueReferenceCards({
    issues,
    isMine,
}: {
    issues: ReferencedIssueLabel[];
    isMine: boolean;
}) {
    if (issues.length === 0) return null;
    return (
        <div
            className={cn(
                "mb-1 mt-1 grid gap-2",
                issues.length > 1 && "grid-cols-[repeat(2,minmax(0,13rem))]",
                isMine ? "justify-end" : "ml-8",
            )}
        >
            {issues.map((issue) => (
                <IssueReferenceCard key={issue.id ?? issue.number} issue={issue} />
            ))}
        </div>
    );
}

function TrailingMessageTime({ isMine, sentAt }: { isMine: boolean; sentAt: Date }) {
    return (
        <>
            <span className={cn("invisible ml-2 inline-block select-none", TIME_TEXT)} aria-hidden>
                {messageTimeLabel(sentAt)}
            </span>
            <MessageTime isMine={isMine} sentAt={sentAt} className="absolute right-3 bottom-1.5" />
        </>
    );
}

export default function ChatMessage({
    chat,
    isMine,
    startsGroup,
    endsGroup,
    viewerId,
    canDelete,
    onReply,
    onDelete,
    onQuoteClick,
    onReaction,
}: {
    chat: AnyChat;
    isMine: boolean;
    startsGroup: boolean;
    endsGroup: boolean;
    viewerId?: string;
    canDelete: boolean;
    onReply: (chat: AnyChat) => void;
    onDelete: (chat: AnyChat) => void;
    onQuoteClick: (chatId: string) => void;
    onReaction: (chat: AnyChat, emoji: string) => void;
}) {
    const name = senderName(chat);
    const sentAt = new Date(chat.createdAt);
    const [isFresh] = useState(() => Date.now() - sentAt.getTime() < 3000);
    const [expanded, setExpanded] = useState(false);
    const clippable = !chat.isDeleted && isClippable(to_plain_text(chat.message, chat.references));
    const reactionPending = useReactionPending(chat.id);
    const reactionDisabled = reactionPending || chat.id.startsWith(OPTIMISTIC_ID_PREFIX);
    const taggedIssues = chat.isDeleted ? [] : taggedIssuesOf(chat);
    return (
        <motion.li
            id={`chat-${chat.id}`}
            initial={isFresh ? { opacity: 0, x: isMine ? 32 : -32, scale: 0.6 } : false}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            style={{ transformOrigin: isMine ? "bottom right" : "bottom left" }}
            className={cn(
                "group/message relative flex flex-col rounded-lg transition-colors duration-300",
                isMine ? "items-end" : "items-start",
                startsGroup ? "mt-5 first:mt-0" : "mt-1.5",
            )}
        >
            <div
                className={cn(
                    "flex w-fit max-w-[84%] flex-col sm:max-w-[72%]",
                    isMine ? "items-end" : "items-start",
                )}
            >
                <IssueReferenceCards issues={taggedIssues} isMine={isMine} />
                <div
                    className={cn("flex items-end gap-2", isMine ? "flex-row-reverse" : "flex-row")}
                >
                    {!isMine && (
                        <PlaygroundAvatar
                            letter={name.charAt(0).toUpperCase()}
                            src={chat.sender?.image ?? undefined}
                            tone={toneFor(chat.senderId ?? name)}
                            size="lg"
                            className={cn("rounded-full", !endsGroup && "invisible")}
                        />
                    )}
                    <article
                        className={cn(
                            "relative  min-w-20 flex-1 rounded-lg px-3 pb-2 pt-1.25 text-[13px] leading-5 tracking-[0.005em] wrap-anywhere transition-colors duration-200",
                            isMine
                                ? "border border-graphite/50 bg-graphite text-neutral-200"
                                : "border border-graphite/50 bg-graphite text-neutral-200",
                            endsGroup && (isMine ? "rounded-br-[1px]" : "rounded-bl-[1px]"),
                        )}
                    >
                        {!chat.isDeleted && (
                            <MessageActions
                                chat={chat}
                                isMine={isMine}
                                canDelete={canDelete}
                                reactionDisabled={reactionDisabled}
                                onReply={onReply}
                                onDelete={onDelete}
                                onReaction={onReaction}
                            />
                        )}
                        {startsGroup && !isMine && (
                            <header
                                className={cn(
                                    "mb-1.5 flex items-center gap-1.5 text-[10px] leading-none font-semibold tracking-[0.025em]",
                                    senderToneText(chat),
                                )}
                            >
                                <span
                                    className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        NAME_TONE_RULE[senderTone(chat)],
                                    )}
                                    aria-hidden
                                />
                                {name}
                            </header>
                        )}
                        {!chat.isDeleted && chat.repliedToId && (
                            <QuotedMessage
                                quote={chat.repliedTo}
                                isMine={isMine}
                                viewerId={viewerId}
                                onQuoteClick={onQuoteClick}
                            />
                        )}
                        {chat.isDeleted ? (
                            <>
                                <span
                                    className={cn(
                                        "italic",
                                        isMine ? "text-white/60" : "text-neutral-500",
                                    )}
                                >
                                    Message deleted
                                </span>
                                <TrailingMessageTime isMine={isMine} sentAt={sentAt} />
                            </>
                        ) : clippable ? (
                            <>
                                <motion.div
                                    initial={false}
                                    animate={{ height: expanded ? "auto" : COLLAPSED_HEIGHT }}
                                    transition={EXPAND_TRANSITION}
                                    className={cn(
                                        "overflow-hidden",
                                        !expanded &&
                                            "[mask-image:linear-gradient(to_bottom,black_65%,transparent)]",
                                    )}
                                >
                                    <MessageBody
                                        text={chat.message}
                                        references={chat.references}
                                        isMine={isMine}
                                    />
                                </motion.div>
                                <div className="mt-1.5 flex items-center justify-between gap-x-3">
                                    <Button
                                        variant="unstyled"
                                        type="button"
                                        onClick={() => setExpanded((prev) => !prev)}
                                        className={cn(
                                            "flex cursor-pointer items-center gap-x-1 text-[11px] leading-none font-medium transition-colors",
                                            isMine
                                                ? "text-white/70 hover:text-white"
                                                : "text-neutral-400 hover:text-neutral-200",
                                        )}
                                    >
                                        {expanded ? "Show less" : "Show more"}
                                        <motion.span
                                            className="flex"
                                            animate={{ rotate: expanded ? 180 : 0 }}
                                            transition={EXPAND_TRANSITION}
                                        >
                                            <HiChevronDown className="size-3" />
                                        </motion.span>
                                    </Button>
                                    <MessageTime
                                        isMine={isMine}
                                        sentAt={sentAt}
                                        className="shrink-0"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <MessageBody
                                    text={chat.message}
                                    references={chat.references}
                                    isMine={isMine}
                                />
                                <TrailingMessageTime isMine={isMine} sentAt={sentAt} />
                            </>
                        )}
                    </article>
                </div>
            </div>
            {!chat.isDeleted && (
                <MessageReactions
                    reactions={chat.reactions ?? []}
                    isMine={isMine}
                    disabled={reactionDisabled}
                    className={cn("max-w-[84%] sm:max-w-[72%]", !isMine && "ml-8")}
                    onReact={(emoji) => onReaction(chat, emoji)}
                />
            )}
        </motion.li>
    );
}
