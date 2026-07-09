import type { Editor, Range } from "@tiptap/core";
import type { IconType } from "react-icons";
import {
    LuHeading1,
    LuHeading2,
    LuHeading3,
    LuList,
    LuListOrdered,
    LuListTodo,
    LuImage,
    LuCode,
    LuQuote,
    LuMinus,
} from "react-icons/lu";

export interface SlashCommandItem {
    title: string;
    icon: IconType;
    command: (props: { editor: Editor; range: Range }) => void;
}

function insertImage(editor: Editor, range: Range) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .setImage({ src: reader.result as string, alt: file.name })
                .run();
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

export const SLASH_COMMAND_ITEMS: SlashCommandItem[] = [
    {
        title: "Heading 1",
        icon: LuHeading1,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(),
    },
    {
        title: "Heading 2",
        icon: LuHeading2,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
    },
    {
        title: "Heading 3",
        icon: LuHeading3,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
    },
    {
        title: "Bulleted list",
        icon: LuList,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
        title: "Numbered list",
        icon: LuListOrdered,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
        title: "Checklist",
        icon: LuListTodo,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleTaskList().run(),
    },
    {
        title: "Insert media",
        icon: LuImage,
        command: ({ editor, range }) => insertImage(editor, range),
    },
    {
        title: "Code block",
        icon: LuCode,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
        title: "Blockquote",
        icon: LuQuote,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
        title: "Divider",
        icon: LuMinus,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
];
