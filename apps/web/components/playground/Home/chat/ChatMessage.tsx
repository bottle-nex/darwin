import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "motion/react";
import { MdContentCopy, MdDelete, MdKeyboardArrowDown } from "react-icons/md";
import { BsReply } from "react-icons/bs";
import { cn } from "@/lib/utils";
import PlaygroundAvatar, {
    toneFor,
    type AvatarTone,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import type { Chat, ProjectChat } from "@trymatcha/types";

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

/**
 * Renders "@Full Name" mentions as pills, matched against this message's own
 * `mentions` (the people actually tagged, per the DB record) rather than the
 * project's current member list — so a mention still highlights correctly
 * even if that person is later renamed or removed from the project.
 */
function renderWithMentions(text: string, chat: AnyChat) {
    const names = [
        ...new Set(
            chat.mentions
                .map((mention) => mention.member?.user?.name ?? mention.member?.user?.email)
                .filter((name): name is string => Boolean(name)),
        ),
    ];
    if (names.length === 0) return text;
    const escaped = names
        .sort((a, b) => b.length - a.length)
        .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pattern = new RegExp(`(@(?:${escaped.join("|")}))`, "gi");
    // With a single capture group, split() puts every matched mention at an odd index.
    return text.split(pattern).map((part, i) =>
        i % 2 === 1 ? (
            <span key={i} className="mx-px px-1 font-semibold text-white">
                {part}
            </span>
        ) : (
            part
        ),
    );
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
                            "truncate text-[12px] leading-4",
                            isMine ? "text-white/65" : "text-neutral-400",
                        )}
                    >
                        {quote.message}
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
}) {
    const name = senderName(chat);
    const sentAt = new Date(chat.createdAt);
    const [isFresh] = useState(() => Date.now() - sentAt.getTime() < 3000);
    return (
        <motion.li
            id={`chat-${chat.id}`}
            initial={isFresh ? { opacity: 0, x: isMine ? 32 : -32, scale: 0.6 } : false}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            style={{ transformOrigin: isMine ? "bottom right" : "bottom left" }}
            className={cn(
                "flex items-end gap-2 rounded-lg transition-colors duration-500 relative",
                isMine ? "flex-row-reverse" : "flex-row",
                startsGroup ? "mt-4 first:mt-0" : "mt-1",
            )}
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
                    "group/bubble relative min-w-0 max-w-[65%] rounded-[5px] px-2.5 py-1.5 text-[13px] leading-snug wrap-anywhere",
                    isMine ? "bg-indigo-500/85 text-white" : "bg-white/6 text-neutral-200",
                    endsGroup && (isMine ? "rounded-br-xs" : "rounded-bl-xs"),
                )}
            >
                {!chat.isDeleted && (
                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={() => onReply(chat)}
                        aria-label="Reply"
                        className={cn(
                            "absolute top-1 z-10 cursor-pointer rounded-md bg-neutral-800 p-1 text-neutral-300 opacity-0 transition-opacity hover:text-white group-hover/bubble:opacity-100",
                            isMine ? "-left-7" : "-right-7",
                        )}
                    >
                        <BsReply className="size-3.5" />
                    </Button>
                )}
                {startsGroup && !isMine && (
                    <header
                        className={cn("mb-0.5 text-[10.5px] font-medium", senderToneText(chat))}
                    >
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
                    <span className={cn("italic", isMine ? "text-white/60" : "text-neutral-500")}>
                        Message deleted
                    </span>
                ) : (
                    renderWithMentions(chat.message, chat)
                )}
                <span className="relative float-right ml-2 mt-1.5 flex items-center">
                    {!chat.isDeleted && (
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger className="cursor-pointer" asChild>
                                <Button
                                    type="button"
                                    variant="unstyled"
                                    aria-label="Message options"
                                    className={cn(
                                        "p-0.5 bg-charcoal rounded-sm aspect-square peer absolute inset-x-0 bottom-0 mx-auto w-fit flex cursor-pointer items-center justify-center opacity-0 transition-opacity group-hover/bubble:opacity-100 data-[state=open]:opacity-100 before:absolute before:-inset-x-3 before:-inset-y-2",
                                        isMine
                                            ? "text-white/80 hover:text-white"
                                            : "text-neutral-400 hover:text-neutral-200",
                                    )}
                                >
                                    <MdKeyboardArrowDown className="size-3.75" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={6} className="w-32">
                                <DropdownMenuItem
                                    onSelect={() => navigator.clipboard.writeText(chat.message)}
                                >
                                    <MdContentCopy className="size-3.5" />
                                    Copy
                                </DropdownMenuItem>
                                {canDelete && (
                                    <DropdownMenuItem onSelect={() => onDelete(chat)}>
                                        <MdDelete className="size-3.5" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    <time
                        dateTime={sentAt.toISOString()}
                        className={cn(
                            "text-[9px] leading-none transition-opacity group-hover/bubble:opacity-0 peer-data-[state=open]:opacity-0",
                            isMine ? "text-white/80" : "text-neutral-400",
                        )}
                    >
                        {sentAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </time>
                </span>
            </article>
        </motion.li>
    );
}
