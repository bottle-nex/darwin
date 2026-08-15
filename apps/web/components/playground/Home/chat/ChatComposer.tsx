"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef } from "react";
import { Extension, type Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useQueryClient } from "@tanstack/react-query";
import type { LabelledReference } from "@trymatcha/types";
import { IoIosSend } from "react-icons/io";
import { Button } from "@/components/ui/button";
import { createReferenceMention, ISSUE_TRIGGER, SUGGESTION_KEYS } from "./referenceMention";

const MESSAGE_CHAR_LIMIT = 5000;

export interface ChatComposerHandle {
    focus: () => void;
}

interface ChatComposerProps {
    projectId: string | undefined;
    placeholder: string;
    disabled?: boolean;
    onSend: (message: string, references: LabelledReference[]) => void;
    children?: React.ReactNode;
}

function serialize(editor: Editor): string {
    return editor
        .getText({
            blockSeparator: "\n",
            textSerializers: {
                mention: ({ node }) =>
                    node.attrs.mentionSuggestionChar === ISSUE_TRIGGER
                        ? `#[issue:${node.attrs.id}]`
                        : `@[member:${node.attrs.id}]`,
            },
        })
        .trim();
}

/**
 * The labels already shown in the composer, shaped like the reference rows the
 * server will return — so the sender's optimistic echo renders real chips
 * instead of tombstones during the round-trip.
 */
function draft_references(editor: Editor): LabelledReference[] {
    const references: LabelledReference[] = [];
    editor.state.doc.descendants((node) => {
        if (node.type.name !== "mention") return;
        const id = node.attrs.id as string;
        const label = (node.attrs.label as string) ?? "";
        if (node.attrs.mentionSuggestionChar === ISSUE_TRIGGER) {
            const [number, ...title] = label.split(" ");
            references.push({
                memberId: null,
                issueId: id,
                issue: { number: Number(number), title: title.join(" ") },
            });
        } else {
            references.push({
                memberId: id,
                issueId: null,
                member: { user: { name: label, email: "" } },
            });
        }
    });
    return references;
}

const ChatComposer = forwardRef<ChatComposerHandle, ChatComposerProps>(function ChatComposer(
    { projectId, placeholder, disabled, onSend, children },
    ref,
) {
    const queryClient = useQueryClient();
    const portalSlot = `reference-portal-${useId()}`;
    const onSendRef = useRef(onSend);
    const disabledRef = useRef(disabled);

    useEffect(() => {
        onSendRef.current = onSend;
        disabledRef.current = disabled;
    });

    function submit(instance: Editor | null) {
        if (!instance || disabledRef.current) return;
        const message = serialize(instance);
        if (!message || message.length > MESSAGE_CHAR_LIMIT) return;
        onSendRef.current(message, draft_references(instance));
        instance.commands.clearContent(true);
    }

    const extensions = useMemo(
        () => [
            StarterKit.configure({
                heading: false,
                bulletList: false,
                orderedList: false,
                listItem: false,
                blockquote: false,
                codeBlock: false,
                horizontalRule: false,
            }),
            Placeholder.configure({ placeholder }),
            ...(projectId
                ? [createReferenceMention(queryClient, projectId, `[data-slot="${portalSlot}"]`)]
                : []),
            Extension.create({
                name: "sendOnEnter",
                addKeyboardShortcuts() {
                    return {
                        Enter: ({ editor }) => {
                            const picking = SUGGESTION_KEYS.some(
                                (key) => key.getState(editor.state)?.active,
                            );
                            if (picking) return false;
                            submit(editor);
                            return true;
                        },
                    };
                },
            }),
        ],
        [projectId, placeholder, portalSlot, queryClient],
    );

    const editor = useEditor(
        {
            immediatelyRender: false,
            extensions,
            editorProps: {
                attributes: {
                    class: "chat-composer min-h-9.5 py-1.75 pl-3 pr-11 text-[13px] leading-5 text-neutral-100",
                },
            },
        },
        [extensions],
    );

    useEffect(() => {
        editor?.setEditable(!disabled);
    }, [editor, disabled]);

    useImperativeHandle(ref, () => ({
        focus: () => editor?.commands.focus("end"),
    }));

    return (
        <div className="rounded-lg bg-[#1a1a1a] shadow-[inset_0_1px_0_0_var(--color-edge)]">
            {children}
            <div className="relative">
                <div
                    data-slot={portalSlot}
                    className="pointer-events-none absolute inset-x-0 bottom-full z-20 flex justify-start px-1"
                />
                <EditorContent
                    editor={editor}
                    data-lenis-prevent
                    className="no-scrollbar max-h-28 overflow-y-auto"
                />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => submit(editor)}
                    disabled={disabled || !editor || editor.isEmpty}
                    aria-label="Send message"
                    className="absolute bottom-0.75 right-1.5 h-8! w-8! text-neutral-400 hover:bg-transparent hover:text-neutral-100 disabled:text-neutral-600"
                >
                    <IoIosSend className="size-5.5" />
                </Button>
            </div>
        </div>
    );
});

export default ChatComposer;
