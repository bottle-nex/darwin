"use client";
import { LoadingSpinnerIcon, SendIcon, StopGenerationIcon } from "@trydarwin/ui/icons";
import { type KeyboardEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import IconWrapper from "@/components/ui/IconWrapper";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type DarwinComposerProps = {
    onSend: (text: string) => void;
    onStop?: () => void;
    /** True while an answer is streaming: the send button becomes a stop button. */
    streaming?: boolean;
    sending?: boolean;
    className?: string;
};

export default function DarwinComposer({
    onSend,
    onStop,
    streaming = false,
    sending = false,
    className,
}: DarwinComposerProps) {
    const [draft, setDraft] = useState("");
    const busy = streaming || sending;
    const canSend = draft.trim().length > 0 && !busy;

    function submit() {
        if (!canSend) return;
        onSend(draft.trim());
        setDraft("");
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
        }
    }

    return (
        <div
            className={cn(
                "surface-card top-lit-edge relative flex flex-col rounded-2xl p-3 backdrop-blur-md",
                className,
            )}
        >
            <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                    sending
                        ? "Sending…"
                        : streaming
                          ? "Darwin is answering…"
                          : "Ask Darwin anything…"
                }
                spellCheck={false}
                disabled={busy}
                className="no-scrollbar max-h-60 min-h-16 resize-none bg-transparent px-1 py-1 text-[15px] leading-relaxed hover:bg-transparent"
            />
            <div className="flex items-center justify-end pt-2">
                <Button
                    variant="unstyled"
                    onClick={streaming ? onStop : submit}
                    disabled={sending || (streaming ? !onStop : !canSend)}
                    aria-label={
                        sending ? "Sending message" : streaming ? "Stop Darwin" : "Send message"
                    }
                    className="group rounded-full"
                >
                    <IconWrapper
                        className={sending ? "cursor-default" : "cursor-pointer"}
                        icon={
                            sending
                                ? LoadingSpinnerIcon
                                : streaming
                                  ? StopGenerationIcon
                                  : SendIcon
                        }
                        iconClassName={sending ? "animate-spin" : undefined}
                        variant="ghost"
                        size="big"
                    />
                </Button>
            </div>
        </div>
    );
}
