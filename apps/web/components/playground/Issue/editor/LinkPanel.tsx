"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MENU_SURFACE } from "@/components/ui/menuSurface";
import { withProtocol } from "@/lib/urls";
import type { Editor } from "@tiptap/core";
import type { LinkPromptRequest } from "./link";

interface LinkPanelProps {
    editor: Editor;
    request: LinkPromptRequest;
    onClose: () => void;
}

const FIELD_CLASS = "h-8 rounded-md px-2 text-[13px]";

export default function LinkPanel({ editor, request, onClose }: LinkPanelProps) {
    const [label, setLabel] = useState(request.label);
    const [href, setHref] = useState(request.href);
    const labelInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        labelInput.current?.focus();
        labelInput.current?.select();
    }, []);

    const coords = editor.view.coordsAtPos(request.to);

    function apply() {
        const url = href.trim();
        if (!url) return;
        const text = label.trim() || url;
        editor
            .chain()
            .focus()
            .insertContentAt(
                { from: request.from, to: request.to },
                {
                    type: "text",
                    text,
                    marks: [{ type: "link", attrs: { href: withProtocol(url) } }],
                },
            )
            .setTextSelection(request.from + text.length)
            .run();
        onClose();
    }

    function remove() {
        editor
            .chain()
            .focus()
            .setTextSelection({ from: request.from, to: request.to })
            .unsetLink()
            .run();
        onClose();
    }

    return (
        <div
            style={{ top: coords.bottom + 8, left: coords.left }}
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Escape") {
                    onClose();
                    editor.commands.focus();
                }
                if (event.key === "Enter") {
                    event.preventDefault();
                    apply();
                }
            }}
            className={cn(MENU_SURFACE, "fixed flex w-72 flex-col gap-1.5 p-2")}
        >
            <Input
                ref={labelInput}
                value={label}
                placeholder="Label"
                onChange={(event) => setLabel(event.target.value)}
                className={FIELD_CLASS}
            />
            <Input
                value={href}
                placeholder="https://"
                onChange={(event) => setHref(event.target.value)}
                className={cn(FIELD_CLASS, "font-mono text-[12px]")}
            />
            <div className="flex items-center justify-end gap-1">
                {request.href && (
                    <Button type="button" variant="ghost" size="xs" onClick={remove}>
                        Remove
                    </Button>
                )}
                <Button type="button" size="xs" onClick={apply}>
                    Apply
                </Button>
            </div>
        </div>
    );
}
