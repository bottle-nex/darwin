"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type Editor, Extension } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { LabelledReference } from "@trydarwin/types";
import { EmojiReactionIcon, SendIcon } from "@trydarwin/ui/icons";
import { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import EmojiPicker from "@/components/ui/EmojiPicker";
import IconWrapper from "@/components/ui/IconWrapper";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";

import { createReferenceMention, SUGGESTION_KEYS, toReferenceText } from "./referenceMention";

const MESSAGE_CHAR_LIMIT = 5000;

export interface ChatComposerHandle {
    focus: () => void;
}

interface ChatComposerProps {
    projectId: string | undefined;
    placeholder: string;
    disabled?: boolean;
    className?: string;
    teamId?: string;
    onSend: (message: string, references: LabelledReference[]) => void;
    children?: React.ReactNode;
}

/**
 * The labels already shown in the composer, shaped like the reference rows the
 * server will return — so the sender's optimistic echo renders real chips
 * instead of tombstones during the round-trip.
 */
function draft_references(editor: Editor): LabelledReference[] {
    const references: LabelledReference[] = [];
    const blank = { memberId: null, issueId: null, teamId: null };
    editor.state.doc.descendants((node) => {
        if (node.type.name !== "mention") return;
        const id = node.attrs.id as string;
        const label = (node.attrs.label as string) ?? "";
        if (node.attrs.kind === "issue") {
            const [identifier, ...title] = label.split(" ");
            references.push({
                ...blank,
                issueId: id,
                issue: {
                    number: Number(identifier?.split("-").pop()),
                    title: title.join(" "),
                },
            });
        } else if (node.attrs.kind === "team") {
            references.push({ ...blank, teamId: id, team: { name: label } });
        } else {
            references.push({
                ...blank,
                memberId: id,
                member: { user: { name: label, email: "" } },
            });
        }
    });
    return references;
}

const ChatComposer = forwardRef<ChatComposerHandle, ChatComposerProps>(function ChatComposer(
    { projectId, placeholder, disabled, className, teamId, onSend, children },
    ref,
) {
    const queryClient = useQueryClient();
    const projectName = useActiveProject()?.name;
    const portalSlot = `reference-portal-${useId()}`;
    const onSendRef = useRef(onSend);
    const disabledRef = useRef(disabled);

    useEffect(() => {
        onSendRef.current = onSend;
        disabledRef.current = disabled;
    });

    function submit(instance: Editor | null) {
        if (!instance || disabledRef.current) return;
        const message = toReferenceText(instance);
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
                ? [
                      createReferenceMention({
                          queryClient,
                          projectId,
                          projectName,
                          container: `[data-slot="${portalSlot}"]`,
                          teamId,
                      }),
                  ]
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
        [projectId, projectName, placeholder, portalSlot, queryClient, teamId],
    );

    const editor = useEditor(
        {
            immediatelyRender: false,
            extensions,
            editorProps: {
                attributes: {
                    class: "chat-composer min-h-9.5 py-2.25 pl-3 pr-11 text-neutral-100",
                    spellcheck: "false",
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
        <div className={cn("surface-inset rounded-[8px]", className)}>
            {children}
            <div className="relative">
                <div
                    data-slot={portalSlot}
                    className="pointer-events-none absolute inset-x-0 bottom-full z-20 flex justify-start px-1"
                />
                <EditorContent
                    editor={editor}
                    data-lenis-prevent
                    className="no-scrollbar max-h-28 overflow-y-auto "
                />
                <Button
                    variant="unstyled"
                    onClick={() => submit(editor)}
                    disabled={disabled || !editor || editor.isEmpty}
                    aria-label="Send message"
                    className="group absolute bottom-1.5 right-1.5 rounded-full"
                >
                    <IconWrapper icon={SendIcon} variant="ghost" />
                </Button>
                <EmojiPicker
                    onSelect={(emoji) => editor?.chain().focus().insertContent(emoji).run()}
                >
                    <Button
                        variant="unstyled"
                        disabled={disabled || !editor}
                        aria-label="Add emoji"
                        className="group absolute bottom-1.5 right-9 rounded-full"
                    >
                        <IconWrapper icon={EmojiReactionIcon} variant="ghost" />
                    </Button>
                </EmojiPicker>
            </div>
        </div>
    );
});

export default ChatComposer;
