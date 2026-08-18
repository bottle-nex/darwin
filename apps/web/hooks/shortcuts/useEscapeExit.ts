"use client";
import { useEffect } from "react";
import type { Editor } from "@tiptap/react";

export function useEscapeExit({
    enabled = true,
    isDirty = false,
    editor,
    onExit,
    onDirtyExit,
}: {
    enabled?: boolean;
    isDirty?: boolean;
    editor?: Editor | null;
    onExit: () => void;
    onDirtyExit?: () => void;
}) {
    useEffect(() => {
        if (!enabled) return;
        function onKeyDown(event: KeyboardEvent) {
            if (event.key !== "Escape" || event.defaultPrevented) return;

            if (editor?.isFocused) {
                editor.commands.blur();
                return;
            }
            const focused = document.activeElement;
            if (focused instanceof HTMLElement && focused !== document.body) {
                focused.blur();
                return;
            }
            if (isDirty && onDirtyExit) {
                onDirtyExit();
                return;
            }
            onExit();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [enabled, isDirty, editor, onExit, onDirtyExit]);
}
