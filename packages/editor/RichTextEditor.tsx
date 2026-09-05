"use client";

import { type AnyExtension, Extension } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { type Editor, EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ImageNodeView from "./ImageNodeView";
import { ImageUpload, type ImageUploader } from "./imageUpload";
import { cn } from "./lib/cn";
import { LINK_ATTRIBUTES, LinkPrompt, type LinkPromptRequest } from "./link";
import LinkPanel from "./LinkPanel";
import { EditorPlaceholder } from "./placeholder";
import { countPrompts, Prompt, PromptMark } from "./prompt";
import SelectionToolbar from "./SelectionToolbar";
import { SlashCommand } from "./slash-command";
import { TableFigure, TableTitle } from "./table";
import { Timestamp } from "./timestamp";
import { Toggle, ToggleBody, ToggleSummary } from "./toggle";

const DEFAULT_CHAR_LIMIT = 2500;

/**
 * StarterKit's HardBreak claims Mod-Enter for a line break, which swallowed the
 * form's save. Shift-Enter still inserts a break; Mod-Enter is left for the
 * submit handler listening on the window.
 */
const ModEnterSubmits = Extension.create({
    name: "modEnterSubmits",
    priority: 1000,
    addKeyboardShortcuts() {
        return { "Mod-Enter": () => true };
    },
});

const ImageWithControls = Image.extend({
    addNodeView() {
        return ReactNodeViewRenderer(ImageNodeView);
    },
});

export interface RichTextEditorState {
    html: string;
    isEmpty: boolean;
    prompts: number;
}

export interface RichTextEditorProps {
    placeholder?: string;
    className?: string;
    initialContent?: string;
    editable?: boolean;
    authoring?: boolean;
    charLimit?: number;
    /** Sends an inserted image to storage. Without it images are inlined as data URLs. */
    onImageUpload?: ImageUploader;
    /** Extensions the host app wires up, such as project-scoped `@member` references. */
    extraExtensions?: AnyExtension[];
    onChange?: (state: RichTextEditorState) => void;
    onReady?: (editor: Editor) => void;
}

export default function RichTextEditor({
    placeholder = "Add a description...",
    className,
    initialContent,
    editable = true,
    authoring = false,
    charLimit = DEFAULT_CHAR_LIMIT,
    onImageUpload,
    extraExtensions,
    onChange,
    onReady,
}: RichTextEditorProps) {
    const [linkRequest, setLinkRequest] = useState<LinkPromptRequest | null>(null);
    const requestLink = useCallback((request: LinkPromptRequest) => setLinkRequest(request), []);
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    });

    const [mountContent] = useState(initialContent);

    const extensions = useMemo(
        () => [
            StarterKit.configure({
                link: {
                    openOnClick: true,
                    linkOnPaste: false,
                    HTMLAttributes: LINK_ATTRIBUTES,
                },
            }),
            TaskList,
            TaskItem.configure({ nested: true }),
            ImageWithControls.configure({ inline: true, allowBase64: true }),
            Toggle,
            ToggleSummary,
            ToggleBody,
            TableFigure,
            TableTitle,
            Timestamp,
            TableKit.configure({ table: { resizable: true } }),
            authoring ? PromptMark : Prompt,
            EditorPlaceholder.configure({ emptyDocText: placeholder }),
            CharacterCount.configure({ limit: charLimit }),
            SlashCommand,
            LinkPrompt.configure({ onRequest: requestLink }),
            ModEnterSubmits,
            ImageUpload.configure({ upload: onImageUpload ?? null }),
            ...(extraExtensions ?? []),
        ],
        [authoring, placeholder, charLimit, onImageUpload, extraExtensions, requestLink],
    );

    const editorProps = useMemo(
        () => ({ attributes: { class: cn("tiptap min-h-full", className) } }),
        [className],
    );

    const editor = useEditor({
        immediatelyRender: false,
        content: mountContent,
        editable,
        extensions,
        editorProps,
        onCreate: ({ editor: created }) => {
            report(created);
            onReady?.(created);
        },
        onUpdate: ({ editor: updated }) => report(updated),
    });

    function report(instance: NonNullable<typeof editor>) {
        onChangeRef.current?.({
            html: instance.getHTML(),
            isEmpty: instance.isEmpty,
            prompts: countPrompts(instance),
        });
    }

    return (
        <>
            {editor && editable && <SelectionToolbar editor={editor} />}
            <EditorContent editor={editor} className="h-full" />
            {editor && editable && linkRequest && (
                <LinkPanel
                    key={`${linkRequest.from}-${linkRequest.to}`}
                    editor={editor}
                    request={linkRequest}
                    onClose={() => setLinkRequest(null)}
                />
            )}
        </>
    );
}
