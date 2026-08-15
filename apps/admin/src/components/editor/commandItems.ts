import type { Editor, Range } from "@tiptap/core";
import {
    Code,
    Heading1,
    Heading2,
    Heading3,
    ImageIcon,
    List,
    ListOrdered,
    ListTodo,
    Minus,
    Quote,
    type LucideIcon,
} from "lucide-react";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, upload_image } from "../../lib/uploads";

export interface SlashCommandItem {
    title: string;
    icon: LucideIcon;
    command: (props: { editor: Editor; range: Range }) => void;
}

function insertImage(editor: Editor, range: Range) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPTED_IMAGE_TYPES;
    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        if (file.size > MAX_IMAGE_BYTES) {
            window.alert(`Images must be under ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
            return;
        }

        try {
            const src = await upload_image(file);
            editor.chain().focus().deleteRange(range).setImage({ src, alt: file.name }).run();
        } catch {
            window.alert("Upload failed. Check that image storage is configured on the server.");
        }
    };
    input.click();
}

export const SLASH_COMMAND_ITEMS: SlashCommandItem[] = [
    {
        title: "Heading 1",
        icon: Heading1,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(),
    },
    {
        title: "Heading 2",
        icon: Heading2,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
    },
    {
        title: "Heading 3",
        icon: Heading3,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
    },
    {
        title: "Bulleted list",
        icon: List,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
        title: "Numbered list",
        icon: ListOrdered,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
        title: "Checklist",
        icon: ListTodo,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleTaskList().run(),
    },
    {
        title: "Image",
        icon: ImageIcon,
        command: ({ editor, range }) => insertImage(editor, range),
    },
    {
        title: "Code block",
        icon: Code,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
        title: "Blockquote",
        icon: Quote,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
        title: "Divider",
        icon: Minus,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
];
