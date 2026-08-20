"use client";

import { Extension } from "@tiptap/core";
import { cn } from "@/lib/utils";
import { TableKit } from "@tiptap/extension-table";
import { Timestamp } from "./timestamp";
import { SlashCommand } from "./slash-command";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorPlaceholder } from "./placeholder";
import { TableFigure, TableTitle } from "./table";
import { Toggle, ToggleBody, ToggleSummary } from "./toggle";
import { Prompt, PromptMark, countPrompts } from "./prompt";
import { EditorContent, ReactNodeViewRenderer, useEditor, type Editor } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import StarterKit from "@tiptap/starter-kit";
import ImageNodeView from "./ImageNodeView";
import SelectionToolbar from "./SelectionToolbar";
import LinkPanel from "./LinkPanel";
import { LINK_ATTRIBUTES, LinkPrompt, type LinkPromptRequest } from "./link";
import CharacterCount from "@tiptap/extension-character-count";
import { useQueryClient } from "@tanstack/react-query";
import { createReferenceMention } from "@/components/playground/Home/chat/referenceMention";

const DESCRIPTION_CHAR_LIMIT = 2500;

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

export interface IssueDescriptionState {
    html: string;
    isEmpty: boolean;
    prompts: number;
}

interface IssueDescriptionEditorProps {
    placeholder?: string;
    className?: string;
    initialContent?: string;
    editable?: boolean;
    authoring?: boolean;
    /** Enables `@member` and `#issue` references, scoped to this project. */
    mentionProjectId?: string;
    onChange?: (state: IssueDescriptionState) => void;
    onReady?: (editor: Editor) => void;
}

export default function IssueDescriptionEditor({
    placeholder = "Add a description...",
    className,
    initialContent,
    editable = true,
    authoring = false,
    mentionProjectId,
    onChange,
    onReady,
}: IssueDescriptionEditorProps) {
    const queryClient = useQueryClient();
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
            TableKit.configure({
                table: { resizable: true },
                tableHeader: {
                    HTMLAttributes: {
                        class: "rounded-sm bg-snow/3 px-4 py-3 text-left align-top font-medium text-snow",
                    },
                },
                tableCell: {
                    HTMLAttributes: {
                        class: "rounded-sm bg-snow/5 px-4 py-3 align-top text-neutral-200",
                    },
                },
            }),
            authoring ? PromptMark : Prompt,
            EditorPlaceholder.configure({ emptyDocText: placeholder }),
            CharacterCount.configure({ limit: DESCRIPTION_CHAR_LIMIT }),
            SlashCommand,
            LinkPrompt.configure({ onRequest: requestLink }),
            ModEnterSubmits,
            ...(mentionProjectId
                ? [
                      createReferenceMention({
                          queryClient,
                          projectId: mentionProjectId,
                          triggers: ["member", "issue"],
                      }),
                  ]
                : []),
        ],
        [authoring, placeholder, mentionProjectId, queryClient, requestLink],
    );

    const editorProps = useMemo(
        () => ({ attributes: { class: cn("tiptap min-h-full no-scro", className) } }),
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
