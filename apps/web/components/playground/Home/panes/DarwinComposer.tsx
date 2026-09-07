"use client";
import { SendIcon } from "@trymatcha/ui/icons";
import { type KeyboardEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import IconWrapper from "@/components/ui/IconWrapper";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type DarwinComposerProps = {
    onSend: (text: string) => void;
    className?: string;
};

export default function DarwinComposer({ onSend, className }: DarwinComposerProps) {
    const [draft, setDraft] = useState("");
    const canSend = draft.trim().length > 0;

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
                "top-lit-edge relative flex flex-col rounded-2xl bg-white/2 p-3 backdrop-blur-md",
                className,
            )}
        >
            <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Darwin anything…"
                spellCheck={false}
                className="no-scrollbar max-h-60 min-h-20 resize-none bg-transparent px-1 py-1 text-[15px] leading-relaxed hover:bg-transparent"
            />
            <div className="flex items-center justify-end pt-2">
                <Button
                    variant="unstyled"
                    onClick={submit}
                    disabled={!canSend}
                    aria-label="Send message"
                    className="group rounded-full"
                >
                    <IconWrapper
                        className="cursor-pointer"
                        icon={SendIcon}
                        variant="ghost"
                        size="big"
                    />
                </Button>
            </div>
        </div>
    );
}
