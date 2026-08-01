import { Button } from "@/components/ui/button";
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

function renderWithMentions(text: string, mentionNames: string[]) {
    const escaped = [...mentionNames]
        .sort((a, b) => b.length - a.length)
        .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pattern =
        escaped.length > 0 ? new RegExp(`(@(?:${escaped.join("|")}))`, "gi") : /(@[^\s@]+)/g;
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
    mentionNames,
    viewerId,
    onReply,
    onQuoteClick,
}: {
    chat: AnyChat;
    isMine: boolean;
    startsGroup: boolean;
    endsGroup: boolean;
    mentionNames: string[];
    viewerId?: string;
    onReply: (chat: AnyChat) => void;
    onQuoteClick: (chatId: string) => void;
}) {
    const name = senderName(chat);
    const sentAt = new Date(chat.createdAt);
    console.log("chat is : ", chat);
    return (
        <li
            id={`chat-${chat.id}`}
            className={cn(
                "flex items-end gap-2 rounded-lg transition-colors duration-500 relative",
                isMine ? "flex-row-reverse" : "flex-row",
                startsGroup ? "mt-4 first:mt-0" : "mt-1",
            )}
        >
            <PlaygroundAvatar
                letter={name.charAt(0).toUpperCase()}
                src={chat.sender?.image ?? undefined}
                tone={toneFor(chat.senderId ?? name)}
                size="lg"
                className={cn("rounded-full", !endsGroup && "invisible")}
            />
            <article
                className={cn(
                    "group/bubble relative min-w-0 max-w-[65%] rounded-[7px] px-2.5 py-1.5 text-[13px] leading-snug wrap-anywhere",
                    isMine ? "bg-indigo-500/85 text-white" : "bg-white/6 text-neutral-200",
                    endsGroup && (isMine ? "rounded-br-xs" : "rounded-bl-xs"),
                )}
            >
                <Button
                    variant="unstyled"
                    type="button"
                    onClick={() => onReply(chat)}
                    aria-label="Reply"
                    className={cn(
                        "absolute top-1 z-10 cursor-pointer rounded-md bg-neutral-800 p-1 text-neutral-300 opacity-0 transition-opacity hover:text-white group-hover/bubble:opacity-100",
                        isMine ? "-left-7" : "right-7",
                    )}
                >
                    <BsReply className="size-3.5" />
                </Button>
                {startsGroup && !isMine && (
                    <header
                        className={cn("mb-0.5 text-[10.5px] font-medium", senderToneText(chat))}
                    >
                        {name}
                    </header>
                )}
                {chat.repliedToId && (
                    <QuotedMessage
                        quote={chat.repliedTo}
                        isMine={isMine}
                        viewerId={viewerId}
                        onQuoteClick={onQuoteClick}
                    />
                )}
                {renderWithMentions(chat.message, mentionNames)}
                <time
                    dateTime={sentAt.toISOString()}
                    className={cn(
                        "float-right ml-2 mt-1.5 text-[9px] leading-none",
                        isMine ? "text-white/80" : "text-neutral-400",
                    )}
                >
                    {sentAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </time>
            </article>
        </li>
    );
}
