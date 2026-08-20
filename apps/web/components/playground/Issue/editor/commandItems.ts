import type { Editor, Range } from "@tiptap/core";
import type { IconType } from "react-icons";
import { LuCalendarClock } from "react-icons/lu";
import type { TimestampMode } from "./timestamp";
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
    LuListCollapse,
    LuHeading,
    LuListTree,
    LuTable,
    LuLink,
} from "react-icons/lu";

export interface SlashCommandItem {
    title: string;
    icon: IconType;
    command: (props: { editor: Editor; range: Range }) => void;
}

export interface SlashCommandGroup {
    title: string;
    icon: IconType;
    items: SlashCommandItem[];
}

export interface SlashCommandSizedInsert {
    title: string;
    icon: IconType;
    insert: (props: { editor: Editor; range: Range; rows: number; cols: number }) => void;
}

export interface SlashCommandDateInsert {
    title: string;
    icon: IconType;
    insertDate: (props: { editor: Editor; range: Range; iso: string; mode: TimestampMode }) => void;
}

export type SlashCommandEntry =
    SlashCommandItem | SlashCommandGroup | SlashCommandSizedInsert | SlashCommandDateInsert;

export function isSlashCommandGroup(entry: SlashCommandEntry): entry is SlashCommandGroup {
    return "items" in entry;
}

export type SlashCommandSelection = SlashCommandEntry & {
    size?: { rows: number; cols: number };
    datetime?: { iso: string; mode: TimestampMode };
};

export function isSlashCommandSizedInsert(
    entry: SlashCommandEntry,
): entry is SlashCommandSizedInsert {
    return "insert" in entry;
}

export function isSlashCommandDateInsert(
    entry: SlashCommandEntry,
): entry is SlashCommandDateInsert {
    return "insertDate" in entry;
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

export const HEADING_ITEMS: SlashCommandItem[] = [
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
];

export const LIST_ITEMS: SlashCommandItem[] = [
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
        title: "Toggle list",
        icon: LuListCollapse,
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setToggle().run(),
    },
];

const DATE_TIME_ENTRY: SlashCommandDateInsert = {
    title: "Date & time",
    icon: LuCalendarClock,
    insertDate: ({ editor, range, iso, mode }) =>
        editor.chain().focus().deleteRange(range).insertTimestamp({ iso, mode }).run(),
};

const TABLE_ENTRY: SlashCommandSizedInsert = {
    title: "Table",
    icon: LuTable,
    insert: ({ editor, range, rows, cols }) =>
        editor.chain().focus().deleteRange(range).insertTableFigure({ rows, cols }).run(),
};

const BLOCK_ITEMS: SlashCommandItem[] = [
    {
        title: "Link",
        icon: LuLink,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).openLinkPrompt().run(),
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

export const SLASH_COMMAND_ENTRIES: SlashCommandEntry[] = [
    { title: "Headings", icon: LuHeading, items: HEADING_ITEMS },
    { title: "Lists", icon: LuListTree, items: LIST_ITEMS },
    DATE_TIME_ENTRY,
    TABLE_ENTRY,
    ...BLOCK_ITEMS,
];

export const SLASH_COMMAND_ITEMS: SlashCommandEntry[] = [
    ...HEADING_ITEMS,
    ...LIST_ITEMS,
    DATE_TIME_ENTRY,
    TABLE_ENTRY,
    ...BLOCK_ITEMS,
];
