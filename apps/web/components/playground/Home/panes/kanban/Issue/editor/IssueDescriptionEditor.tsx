"use client";

import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { SlashCommand } from "./slash-command";
import ImageNodeView from "./ImageNodeView";

const DESCRIPTION_CHAR_LIMIT = 2500;

const ImageWithControls = Image.extend({
    addNodeView() {
        return ReactNodeViewRenderer(ImageNodeView);
    },
});

interface IssueDescriptionEditorProps {
    placeholder?: string;
    className?: string;
    onChange?: (html: string, isEmpty: boolean) => void;
}

export default function IssueDescriptionEditor({
    placeholder = "Add a description... type '/' for commands",
    className,
    onChange,
}: IssueDescriptionEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({ nested: true }),
            ImageWithControls.configure({ inline: true, allowBase64: true }),
            Placeholder.configure({ placeholder }),
            CharacterCount.configure({ limit: DESCRIPTION_CHAR_LIMIT }),
            SlashCommand,
        ],
        editorProps: {
            attributes: {
                class: cn("tiptap min-h-full", className),
            },
        },
        onUpdate: ({ editor: updatedEditor }) => {
            onChange?.(updatedEditor.getHTML(), updatedEditor.isEmpty);
        },
    });

    return <EditorContent editor={editor} className="h-full" />;
}
