import type { Editor, Range } from "@tiptap/core";
import type { IconType } from "@trydarwin/ui/icons";
import {
    BlockquoteFormatIcon,
    BulletListIcon,
    ChecklistFormatIcon,
    CodeFormatIcon,
    DateTimeInsertIcon,
    DividerIcon,
    Heading1Icon,
    Heading2Icon,
    Heading3Icon,
    HeadingGroupIcon,
    LinkFormatIcon,
    ListGroupIcon,
    MediaInsertIcon,
    NumberedListIcon,
    TableInsertIcon,
    ToggleListIcon,
} from "@trydarwin/ui/icons";

import type { TimestampMode } from "./timestamp";
import { imageUploader } from "./imageUpload";

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

function readAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function insertImage(editor: Editor, range: Range) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const upload = imageUploader(editor);
        const src = await (upload ? upload(file) : readAsDataUrl(file)).catch(() => null);
        if (!src) return;
        editor.chain().focus().deleteRange(range).setImage({ src, alt: file.name }).run();
    };
    input.click();
}

export const HEADING_ITEMS: SlashCommandItem[] = [
    {
        title: "Heading 1",
        icon: Heading1Icon,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(),
    },
    {
        title: "Heading 2",
        icon: Heading2Icon,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
    },
    {
        title: "Heading 3",
        icon: Heading3Icon,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
    },
];

export const LIST_ITEMS: SlashCommandItem[] = [
    {
        title: "Bulleted list",
        icon: BulletListIcon,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
        title: "Numbered list",
        icon: NumberedListIcon,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
        title: "Checklist",
        icon: ChecklistFormatIcon,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleTaskList().run(),
    },
    {
        title: "Toggle list",
        icon: ToggleListIcon,
        command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setToggle().run(),
    },
];

const DATE_TIME_ENTRY: SlashCommandDateInsert = {
    title: "Date & time",
    icon: DateTimeInsertIcon,
    insertDate: ({ editor, range, iso, mode }) =>
        editor.chain().focus().deleteRange(range).insertTimestamp({ iso, mode }).run(),
};

const TABLE_ENTRY: SlashCommandSizedInsert = {
    title: "Table",
    icon: TableInsertIcon,
    insert: ({ editor, range, rows, cols }) =>
        editor.chain().focus().deleteRange(range).insertTableFigure({ rows, cols }).run(),
};

const BLOCK_ITEMS: SlashCommandItem[] = [
    {
        title: "Link",
        icon: LinkFormatIcon,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).openLinkPrompt().run(),
    },
    {
        title: "Insert media",
        icon: MediaInsertIcon,
        command: ({ editor, range }) => insertImage(editor, range),
    },
    {
        title: "Code block",
        icon: CodeFormatIcon,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
        title: "Blockquote",
        icon: BlockquoteFormatIcon,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
        title: "Divider",
        icon: DividerIcon,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
];

export const SLASH_COMMAND_ENTRIES: SlashCommandEntry[] = [
    { title: "Headings", icon: HeadingGroupIcon, items: HEADING_ITEMS },
    { title: "Lists", icon: ListGroupIcon, items: LIST_ITEMS },
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
