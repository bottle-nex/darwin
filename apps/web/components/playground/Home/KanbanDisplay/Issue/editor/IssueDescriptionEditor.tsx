"use client";

import { useEffect, useRef } from "react";
import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { SlashCommand } from "./slash-command";
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
}

export default function IssueDescriptionEditor({
    placeholder = "Add a description... type '/' for commands",
    className,
    initialContent,
    editable = true,
    authoring = false,
    onChange,
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
            authoring ? PromptMark : Prompt,
            Placeholder.configure({ placeholder }),
            CharacterCount.configure({ limit: DESCRIPTION_CHAR_LIMIT }),
            SlashCommand,
        ],
        editorProps: {
            attributes: {
                class: cn("tiptap min-h-full no-scro", className),
            },
        },
        onCreate: ({ editor: created }) => report(created),
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
