import type { ReactionSummary } from "@trymatcha/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MessageReactions({
    reactions,
    isMine,
    disabled,
    className,
    onReact,
}: {
    reactions: ReactionSummary[];
    isMine: boolean;
    disabled: boolean;
    className?: string;
    onReact: (emoji: string) => void;
}) {
    if (reactions.length === 0) return null;
    return (
        <div
            className={cn(
                "mt-1 flex flex-wrap items-center gap-1",
                isMine ? "justify-end" : "justify-start",
                className,
            )}
        >
            {reactions.map((reaction) => (
                <Button
                    key={reaction.emoji}
                    variant="unstyled"
                    disabled={disabled}
                    onClick={() => onReact(reaction.emoji)}
                    aria-label={`${reaction.reactedByViewer ? "Remove" : "Add"} ${reaction.emoji} reaction`}
                    className={cn(
                        "flex h-6 cursor-pointer items-center gap-1 rounded-full border px-1.5 text-[12px] leading-none transition-colors",
                        reaction.reactedByViewer
                            ? "border-white/25 bg-white/12 text-white"
                            : "border-white/8 bg-white/5 text-neutral-300 hover:border-white/15 hover:bg-white/10",
                    )}
                >
                    <span>{reaction.emoji}</span>
                    <span className="text-[10px] tabular-nums">{reaction.count}</span>
                </Button>
            ))}
        </div>
    );
}
