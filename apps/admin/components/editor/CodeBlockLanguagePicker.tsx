"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";

import { CODE_LANGUAGES } from "@/lib/languages";

export default function CodeBlockLanguagePicker({ editor }: { editor: Editor | null }) {
    const codeBlock = useEditorState({
        editor,
        selector: ({ editor: current }) => ({
            active: current?.isActive("codeBlock") ?? false,
            language: (current?.getAttributes("codeBlock").language as string | null) ?? "",
        }),
    });

    if (!editor || !codeBlock?.active) return null;

    return (
        <label className="absolute top-0 right-0 z-40 flex items-center gap-2 rounded-lg bg-cement px-2.5 py-1.5 ring-1 ring-white/10">
            <span className="text-[10px] tracking-[0.18em] text-mist/35 uppercase">Language</span>
            <select
                value={codeBlock.language}
                onChange={(event) =>
                    editor
                        .chain()
                        .focus()
                        .updateAttributes("codeBlock", { language: event.target.value || null })
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
    );
}
