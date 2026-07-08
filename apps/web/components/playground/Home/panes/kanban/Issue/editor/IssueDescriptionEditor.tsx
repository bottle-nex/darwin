"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { SlashCommand } from "./slash-command";

interface IssueDescriptionEditorProps {
    placeholder?: string;
    className?: string;
}

export default function IssueDescriptionEditor({
    placeholder = "Add a description... type '/' for commands",
    className,
}: IssueDescriptionEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({ nested: true }),
            Image,
            Placeholder.configure({ placeholder }),
            SlashCommand,
        ],
        editorProps: {
            attributes: {
                class: cn("tiptap min-h-full", className),
            },
        },
    });

    return <EditorContent editor={editor} className="h-full" />;
}
