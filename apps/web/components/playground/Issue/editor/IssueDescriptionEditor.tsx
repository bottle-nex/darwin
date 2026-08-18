"use client";

import { useEffect, useRef } from "react";
import { EditorContent, ReactNodeViewRenderer, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import CharacterCount from "@tiptap/extension-character-count";
import { TableKit } from "@tiptap/extension-table";
import { SlashCommand } from "./slash-command";
import { EditorPlaceholder } from "./placeholder";
import { Toggle, ToggleBody, ToggleSummary } from "./toggle";
import { TableFigure, TableTitle } from "./table";
import { Timestamp } from "./timestamp";
import { Prompt, PromptMark, countPrompts } from "./prompt";
import ImageNodeView from "./ImageNodeView";

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
    onChange?: (state: IssueDescriptionState) => void;
    onReady?: (editor: Editor) => void;
}

export default function IssueDescriptionEditor({
    placeholder = "Add a description...",
    className,
    initialContent,
    editable = true,
    authoring = false,
    onChange,
    onReady,
}: IssueDescriptionEditorProps) {
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
                        class: "border border-white/12 bg-white/6 px-2 py-1 text-left align-top font-medium",
                    },
                },
                tableCell: {
                    HTMLAttributes: { class: "border border-white/12 px-2 py-1 align-top" },
                },
            }),
            authoring ? PromptMark : Prompt,
            EditorPlaceholder.configure({ emptyDocText: placeholder }),
            CharacterCount.configure({ limit: DESCRIPTION_CHAR_LIMIT }),
            SlashCommand,
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
