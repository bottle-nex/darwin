"use client";
import { useEffect } from "react";
import type { Editor } from "@tiptap/react";

function isInsideEditor(editor: Editor | null | undefined, node: Element | null): boolean {
    if (!editor || editor.isDestroyed || !node) return false;
    return editor.view.dom.contains(node);
}

function isPickerOpen(editor: Editor): boolean {
    return editor.state.plugins.some((plugin) => {
        const state = plugin.getState?.(editor.state) as
            { active?: boolean; range?: unknown } | undefined;
        return Boolean(state && state.active === true && "range" in state);
    });
}

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
            if (event.key !== "Escape") return;

            /**
             * ProseMirror calls `preventDefault` on every Escape it sees, so the
             * editor is resolved before the guard that lets other layers claim
             * the key — otherwise a focused editor swallows Escape forever.
             */
            if (isInsideEditor(editor, document.activeElement)) {
                if (isPickerOpen(editor!)) return;
                (editor!.view.dom as HTMLElement).blur();
                return;
            }

            if (event.defaultPrevented) return;

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
