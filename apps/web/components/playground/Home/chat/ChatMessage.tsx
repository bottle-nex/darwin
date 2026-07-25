import { Button } from "@/components/ui/button";
import { BsReply } from "react-icons/bs";
import { cn } from "@/lib/utils";
import PlaygroundAvatar, {
    toneFor,
    type AvatarTone,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import type { Chat, ProjectChat } from "@trymatcha/types";

/** Per-sender name color inside the bubble, matched to their avatar tone (WhatsApp-style). */
const NAME_TONE_TEXT: Record<AvatarTone, string> = {
    indigo: "text-indigo-300",
    purple: "text-violet-300",
    blue: "text-sky-300",
    emerald: "text-emerald-300",
    dark: "text-neutral-300",
};

/**
 * Renders "@Full Name" mentions as pills. Matches against the project's member
 * names (longest first, so "Piyush Raj" wins over "Piyush"); falls back to bare
 * "@word" tokens while members are still loading.
 */
function renderWithMentions(text: string, mentionNames: string[]) {
    const escaped = [...mentionNames]
        .sort((a, b) => b.length - a.length)
        .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pattern =
        escaped.length > 0 ? new RegExp(`(@(?:${escaped.join("|")}))`, "gi") : /(@[^\s@]+)/g;
    // With a single capture group, split() puts every matched mention at an odd index.
    return text.split(pattern).map((part, i) =>
        i % 2 === 1 ? (
            <span key={i} className="mx-px rounded-[5px] px-1 py-px font-semibold text-white">
                {part}
            </span>
        ) : (
            part
        ),
    );
}

/** "12:02 AM" — local wall-clock time for a comment. */
function formatChatTime(value: Date | string): string {
    return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * One comment row. Consecutive messages from the same sender are grouped:
 * incoming runs show the name on the first bubble and the avatar on the last;
 * the current user's own messages are bare bubbles on the right (no avatar).
 */
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
    chat: Chat | ProjectChat;
    isMine: boolean;
    startsGroup: boolean;
    endsGroup: boolean;
    mentionNames: string[];
    viewerId?: string;
    onReply: (chat: Chat | ProjectChat) => void;
    onQuoteClick: (chatId: string) => void;
}) {
    const name = chat.sender?.name ?? "Unknown";
    const quote = chat.repliedTo;
    return (
        <li
            id={`chat-${chat.id}`}
            className={cn(
                "flex items-end gap-2 rounded-lg transition-colors duration-500",
                isMine ? "flex-row-reverse" : "flex-row",
                startsGroup ? "mt-4 first:mt-0" : "mt-1",
            )}
        >
            {/* Avatar gutter, incoming only — filled on the last of a run, else a spacer to keep bubbles aligned. */}
            {!isMine &&
                (endsGroup ? (
                    <PlaygroundAvatar
                        letter={name.charAt(0).toUpperCase()}
                        src={chat.sender?.image ?? undefined}
                        tone={toneFor(chat.senderId ?? name)}
                        size="md"
                        className="translate-y-1 rounded-full"
                    />
                ) : (
                    <span className="size-5 shrink-0" aria-hidden />
                ))}
            <div
                className={cn(
                    "flex min-w-0 max-w-[65%] flex-col",
                    isMine ? "items-end" : "items-start",
                )}
            >
                <div
                    className={cn(
                        "group/bubble relative min-w-0 max-w-full rounded-[10px] px-2.5 py-1.5 text-[13px] leading-snug wrap-anywhere",
                        isMine ? "bg-indigo-500/85 text-white" : "bg-white/6 text-neutral-200",
                        // Only the last bubble of a run gets the pointed tail corner.
                        endsGroup && (isMine ? "rounded-br-xs" : "rounded-bl-xs"),
                    )}
                >
                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={() => onReply(chat)}
                        aria-label="Reply"
                        className={cn(
                            "absolute top-1 z-10 rounded-md bg-neutral-800 p-1 text-neutral-300 opacity-0 transition-opacity hover:text-white group-hover/bubble:opacity-100 cursor-pointer",
                            // Sits on the bubble corner facing the center of the thread.
                            isMine ? "left-1" : "right-1",
                        )}
                    >
                        <BsReply className="size-3.5" />
                    </Button>
                    {startsGroup && !isMine && (
                        <span
                            className={cn(
                                "mb-0.5 block text-[10.5px] font-medium",
                                NAME_TONE_TEXT[toneFor(chat.senderId ?? name)],
                            )}
                        >
                            {name}
                        </span>
                    )}
                    {chat.repliedToId && (
                        <Button
                            variant="unstyled"
                            type="button"
                            onClick={() => quote && !quote.isDeleted && onQuoteClick(quote.id)}
                            className={cn(
                                "mb-1 flex w-full min-w-32 max-w-full flex-col overflow-hidden rounded-[7px] border-l-2 px-2 py-1 text-left",
                                isMine
                                    ? "border-white/60 bg-black/15"
                                    : "border-indigo-400 bg-black/25",
                            )}
                        >
                            {quote && !quote.isDeleted ? (
                                <>
                                    <span
                                        className={cn(
                                            "min-w-0 max-w-full truncate text-[10.5px] font-medium",
                                            isMine
                                                ? "text-white/90"
                                                : NAME_TONE_TEXT[
                                                      toneFor(
                                                          quote.senderId ??
                                                              quote.sender?.name ??
                                                              "Unknown",
                                                      )
                                                  ],
                                        )}
                                    >
                                        {quote.senderId && quote.senderId === viewerId
                                            ? "You"
                                            : (quote.sender?.name ?? "Unknown")}
                                    </span>
                                    <span className="min-w-0 max-w-full truncate text-[11.5px] opacity-70">
                                        {quote.message}
                                    </span>
                                </>
                            ) : (
                                <span className="text-[11.5px] italic opacity-60">
                                    {quote?.isDeleted ? "Message deleted" : "Message unavailable"}
                                </span>
                            )}
                        </Button>
                    )}
                    {renderWithMentions(chat.message, mentionNames)}
                    {/* Invisible spacer floated at the end so only the last line leaves
                        room for the absolutely-placed time; earlier lines use full width. */}
                    <span aria-hidden className="pointer-events-none float-right h-4 w-11" />
                    <span
                        className={cn(
                            "absolute bottom-1.5 right-2.5 text-[9px] leading-none",
                            isMine ? "text-white/80" : "text-neutral-400",
                        )}
                    >
                        {formatChatTime(chat.createdAt)}
                    </span>
                </div>
            </div>
        </li>
    );
}
