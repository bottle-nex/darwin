import { cn } from "@/lib/utils";
import PlaygroundAvatar, {
    toneFor,
    type AvatarTone,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import type { Chat } from "@trymatcha/types";

/** Per-sender name color inside the bubble, matched to their avatar tone (WhatsApp-style). */
const NAME_TONE_TEXT: Record<AvatarTone, string> = {
    indigo: "text-indigo-300",
    purple: "text-violet-300",
    blue: "text-sky-300",
    emerald: "text-emerald-300",
    dark: "text-neutral-300",
};

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
}: {
    chat: Chat;
    isMine: boolean;
    startsGroup: boolean;
    endsGroup: boolean;
}) {
    const name = chat.sender?.name ?? "Unknown";
    return (
        <li
            className={cn(
                "flex items-end gap-2",
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
                        className="rounded-full"
                    />
                ) : (
                    <span className="size-5 shrink-0" aria-hidden />
                ))}
            <div className={cn("flex max-w-[80%] flex-col", isMine ? "items-end" : "items-start")}>
                <div
                    className={cn(
                        "relative flex flex-col rounded-[10px] px-3 py-2 text-[13px] leading-snug wrap-break-word",
                        isMine
                            ? "bg-indigo-500/85 text-white"
                            : "rounded-bl-xs bg-white/6 text-neutral-200",
                    )}
                >
                    {startsGroup && !isMine && (
                        <span
                            className={cn(
                                "mb-0.5 text-[11px] font-medium",
                                NAME_TONE_TEXT[toneFor(chat.senderId ?? name)],
                            )}
                        >
                            {name}
                        </span>
                    )}
                    {/* Reserve last-line space so the time sits on the same row for a
                        short message and drops to bottom-right when the text wraps. */}
                    <span className="pr-12">{chat.message}</span>
                    <span
                        className={cn(
                            "absolute bottom-2 right-3 text-[10px] leading-none",
                            isMine ? "text-white/60" : "text-neutral-500",
                        )}
                    >
                        {formatChatTime(chat.createdAt)}
                    </span>
                </div>
            </div>
        </li>
    );
}
