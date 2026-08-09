"use client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import type { Notification } from "@trymatcha/types";
import { notification_view, short_age, theme_of } from "./notificationView";

type NotificationRowProps = {
    notification: Notification;
    clickable: boolean;
    onSelect: () => void;
};

export default function NotificationRow({
    notification,
    clickable,
    onSelect,
}: NotificationRowProps) {
    const { actorId, actorName, action, body, issueRef, projectSlug } =
        notification_view(notification);
    const { icon: Icon, tint } = theme_of(notification);
    const createdAt = new Date(notification.createdAt);
    const is_unread = !notification.readAt;

    return (
        <button
            type="button"
            disabled={!clickable}
            onClick={onSelect}
            className={cn(
                "flex w-full items-start gap-2.5 rounded-lg px-2 py-2.5 text-left transition-colors duration-150",
                clickable
                    ? "cursor-pointer hover:bg-white/4 focus-visible:bg-white/4 focus-visible:outline-none"
                    : "cursor-default",
            )}
        >
            <span className="relative mt-px shrink-0">
                <PlaygroundAvatar
                    letter={actorName[0]?.toUpperCase() ?? "?"}
                    tone={toneFor(actorId || notification.id)}
                    size="lg"
                />
                <span
                    className={cn(
                        "absolute -right-1 -bottom-1 flex size-3.5 items-center justify-center rounded-full bg-charcoal ring-2 ring-charcoal",
                        tint,
                    )}
                    aria-hidden
                >
                    <Icon className="size-2.5" />
                </span>
            </span>

            <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-neutral-400">
                        <span className="font-medium text-neutral-100">{actorName}</span> {action}
                    </span>
                    <span
                        className="flex shrink-0 items-center gap-1.5 text-[11px] tabular-nums text-neutral-600"
                        title={format(createdAt, "PPpp")}
                    >
                        {short_age(createdAt)}
                        {is_unread && (
                            <span
                                className="size-1.5 shrink-0 rounded-full bg-violet-400"
                                aria-hidden
                            />
                        )}
                    </span>
                </span>

                {body && (
                    <span className="mt-1 line-clamp-2 text-[12.5px] leading-[1.45] text-neutral-500">
                        {body}
                    </span>
                )}

                {(issueRef || projectSlug) && (
                    <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-neutral-600">
                        {issueRef && (
                            <span className="truncate font-medium text-neutral-500">
                                {issueRef}
                            </span>
                        )}
                        {issueRef && projectSlug && (
                            <span
                                className="size-0.5 shrink-0 rounded-full bg-white/25"
                                aria-hidden
                            />
                        )}
                        {projectSlug && <span className="shrink-0">{projectSlug}</span>}
                    </span>
                )}
            </span>
        </button>
    );
}
