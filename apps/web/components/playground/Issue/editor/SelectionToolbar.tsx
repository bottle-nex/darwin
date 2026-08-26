"use client";

import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import { type ReactNode, useState } from "react";
import {
    LuBold,
    LuChevronDown,
    LuCode,
    LuItalic,
    LuLink,
    LuList,
    LuMinus,
    LuQuote,
    LuStrikethrough,
    LuUnderline,
} from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { HEADING_ITEMS, LIST_ITEMS, type SlashCommandItem } from "./commandItems";

type Dropdown = "text" | "list" | null;

const MARKS = [
    { name: "bold", icon: LuBold, label: "Bold" },
    { name: "italic", icon: LuItalic, label: "Italic" },
    { name: "underline", icon: LuUnderline, label: "Underline" },
    { name: "strike", icon: LuStrikethrough, label: "Strikethrough" },
    { name: "code", icon: LuCode, label: "Inline code" },
] as const;

const PARAGRAPH: SlashCommandItem = {
    title: "Text",
    icon: LuMinus,
    command: ({ editor }) => editor.chain().focus().setParagraph().run(),
};

const BLOCK_ITEMS: SlashCommandItem[] = [
    {
        title: "Blockquote",
        icon: LuQuote,
        command: ({ editor }) => editor.chain().focus().toggleBlockquote().run(),
    },
];

function ToolbarButton({
    active,
    label,
    onClick,
    children,
}: {
    active?: boolean;
    label: string;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <Button
            variant="unstyled"
            type="button"
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            className={cn(
                "flex cursor-pointer items-center gap-1 rounded-[5px] px-1.5 py-1 text-neutral-300 transition-colors",
                active ? "bg-snow/15 text-neutral-100" : "hover:bg-snow/10",
            )}
        >
            {children}
        </Button>
    );
}

export default function SelectionToolbar({ editor }: { editor: Editor }) {
    const [dropdown, setDropdown] = useState<Dropdown>(null);

    function runItem(item: SlashCommandItem) {
        const { from } = editor.state.selection;
        item.command({ editor, range: { from, to: from } });
        setDropdown(null);
    }

    function menu(items: SlashCommandItem[]) {
        return (
            <div className="absolute top-full left-0 z-50 mt-1 flex w-48 flex-col gap-px rounded-md border border-snow/10 bg-neutral-900 p-1 shadow-lg">
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Button
                            variant="unstyled"
                            key={item.title}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => runItem(item)}
                            className="flex cursor-pointer items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-[13px] text-neutral-200 transition-colors hover:bg-snow/10"
                        >
                            <Icon className="size-4 shrink-0 text-neutral-400" />
                            {item.title}
                        </Button>
                    );
                })}
            </div>
        );
    }

    return (
        <BubbleMenu
            editor={editor}
            options={{ placement: "top" }}
            className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-snow/10 bg-neutral-900 p-1 shadow-xl"
        >
            <div className="relative">
                <ToolbarButton
                    label="Text style"
                    active={dropdown === "text"}
                    onClick={() => setDropdown(dropdown === "text" ? null : "text")}
                >
                    <span className="text-[13px]">Aa</span>
                    <LuChevronDown className="size-3 text-neutral-500" />
                </ToolbarButton>
                {dropdown === "text" && menu([PARAGRAPH, ...HEADING_ITEMS])}
            </div>

            <span className="mx-1 h-4 w-px bg-snow/10" />

            {MARKS.map((mark) => {
                const Icon = mark.icon;
                return (
                    <ToolbarButton
                        key={mark.name}
                        label={mark.label}
                        active={editor.isActive(mark.name)}
                        onClick={() => editor.chain().focus().toggleMark(mark.name).run()}
                    >
                        <Icon className="size-4" />
                    </ToolbarButton>
                );
            })}

            <span className="mx-1 h-4 w-px bg-snow/10" />

            {BLOCK_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                    <ToolbarButton
                        key={item.title}
                        label={item.title}
                        active={editor.isActive("blockquote")}
                        onClick={() => runItem(item)}
                    >
                        <Icon className="size-4" />
                    </ToolbarButton>
                );
            })}

            <ToolbarButton
                label="Link"
                active={editor.isActive("link")}
                onClick={() => editor.chain().focus().openLinkPrompt().run()}
            >
                <LuLink className="size-4" />
            </ToolbarButton>

            <div className="relative">
                <ToolbarButton
                    label="Lists"
                    active={dropdown === "list"}
                    onClick={() => setDropdown(dropdown === "list" ? null : "list")}
                >
                    <LuList className="size-4" />
                    <LuChevronDown className="size-3 text-neutral-500" />
                </ToolbarButton>
                {dropdown === "list" && menu(LIST_ITEMS)}
            </div>
        </BubbleMenu>
    );
}
