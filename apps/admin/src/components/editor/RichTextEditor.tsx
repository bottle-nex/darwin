import { useEffect, useRef } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { cn } from "../../lib/cn";
import { CODE_LANGUAGES } from "../../lib/languages";
import { SlashCommand } from "./slash-command";

const CHARACTER_LIMIT = 40000;

export interface RichTextEditorState {
    html: string;
    isEmpty: boolean;
    characters: number;
}

interface RichTextEditorProps {
    placeholder?: string;
    className?: string;
    initialContent?: string;
    onChange?: (state: RichTextEditorState) => void;
}

export default function RichTextEditor({
    placeholder = "Write your post… press '/' for commands",
    className,
    initialContent,
    onChange,
}: RichTextEditorProps) {
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    });

    const editor = useEditor({
        immediatelyRender: false,
        content: initialContent,
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({ nested: true }),
            Image.configure({ inline: false, allowBase64: false }),
            Placeholder.configure({ placeholder }),
            CharacterCount.configure({ limit: CHARACTER_LIMIT }),
            SlashCommand,
        ],
        editorProps: {
            attributes: {
                class: cn("tiptap min-h-full", className),
            },
        },
        onCreate: ({ editor: created }) => report(created),
        onUpdate: ({ editor: updated }) => report(updated),
    });

    const codeBlock = useEditorState({
        editor,
        selector: ({ editor: current }) => ({
            active: current?.isActive("codeBlock") ?? false,
            language: (current?.getAttributes("codeBlock").language as string | null) ?? "",
        }),
    });

    function report(instance: NonNullable<typeof editor>) {
        onChangeRef.current?.({
            html: instance.getHTML(),
            isEmpty: instance.isEmpty,
            characters: instance.storage.characterCount.characters(),
        });
    }

    return (
        <div className="relative h-full">
            {codeBlock?.active && (
                <label className="absolute top-0 right-0 z-40 flex items-center gap-2 rounded-lg bg-cement px-2.5 py-1.5 ring-1 ring-white/10">
                    <span className="text-[10px] tracking-[0.18em] text-mist/35 uppercase">
                        Language
                    </span>
                    <select
                        value={codeBlock.language}
                        onChange={(event) =>
                            editor
                                ?.chain()
                                .focus()
                                .updateAttributes("codeBlock", {
                                    language: event.target.value || null,
                                })
                                .run()
                        }
                        className="rounded bg-transparent text-[12px] text-mist/80 outline-none"
                    >
                        <option value="">Plain</option>
                        {CODE_LANGUAGES.map((language) => (
                            <option key={language.value} value={language.value}>
                                {language.label}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            <EditorContent editor={editor} className="h-full" />
        </div>
    );
}
