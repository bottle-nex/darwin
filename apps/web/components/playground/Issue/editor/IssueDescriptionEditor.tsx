"use client";

import { cn } from "@/lib/utils";
import { TableKit } from "@tiptap/extension-table";
import { Timestamp } from "./timestamp";
import { SlashCommand } from "./slash-command";
import { useEffect, useRef } from "react";
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
import CharacterCount from "@tiptap/extension-character-count";
import { useQueryClient } from "@tanstack/react-query";
import { createReferenceMention } from "@/components/playground/Home/chat/referenceMention";

const DESCRIPTION_CHAR_LIMIT = 2500;

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
    /** Enables `@member` mentions, scoped to this project's members. */
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
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    });

    const editor = useEditor({
        immediatelyRender: false,
        content: initialContent,
        editable,
        extensions: [
            StarterKit,
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
                        class: "rounded-sm bg-graphite px-4 py-3 text-left align-top font-medium text-snow",
                    },
                },
                tableCell: {
                    HTMLAttributes: {
                        class: "rounded-sm bg-cement px-4 py-3 align-top text-neutral-200",
                    },
                },
            }),
            authoring ? PromptMark : Prompt,
            EditorPlaceholder.configure({ emptyDocText: placeholder }),
            CharacterCount.configure({ limit: DESCRIPTION_CHAR_LIMIT }),
            SlashCommand,
            ...(mentionProjectId
                ? [
                      createReferenceMention({
                          queryClient,
                          projectId: mentionProjectId,
                          triggers: ["member"],
                      }),
                  ]
                : []),
        ],
        editorProps: {
            attributes: {
                class: cn("tiptap min-h-full no-scro", className),
            },
        },
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

    return <EditorContent editor={editor} className="h-full" />;
}
