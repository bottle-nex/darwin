import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface EditorPlaceholderOptions {
    emptyDocText: string;
    commandHintText: string;
    commandHintKey: string;
    tableTitleText: string;
}

function buildPlaceholder(text: string, key?: string) {
    const span = document.createElement("span");
    span.className = "editor-placeholder";
    span.contentEditable = "false";

    if (!key) {
        span.textContent = text;
        return span;
    }

    const [before, after] = text.split("{key}");
    const kbd = document.createElement("kbd");
    kbd.textContent = key;
    span.append(document.createTextNode(before ?? ""), kbd, document.createTextNode(after ?? ""));
    return span;
}

export const EditorPlaceholder = Extension.create<EditorPlaceholderOptions>({
    name: "editorPlaceholder",

    addOptions() {
        return {
            emptyDocText: "Add a description...",
            commandHintText: "Type {key} for commands",
            commandHintKey: "/",
            tableTitleText: "Table title",
        };
    },

    addProseMirrorPlugins() {
        const { emptyDocText, commandHintText, commandHintKey, tableTitleText } = this.options;
        const editor = this.editor;

        function hint(pos: number, text: string, key?: string) {
            return [
                Decoration.node(pos, pos + 2, { class: "has-placeholder" }),
                Decoration.widget(pos + 1, () => buildPlaceholder(text, key), {
                    side: -1,
                    ignoreSelection: true,
                }),
            ];
        }

        return [
            new Plugin({
                key: new PluginKey("editorPlaceholder"),
                props: {
                    decorations: (state) => {
                        const { doc, selection } = state;

                        const tableTitleHints: Decoration[] = [];
                        doc.descendants((node, pos) => {
                            if (node.type.name === "tableTitle" && node.content.size === 0)
                                tableTitleHints.push(...hint(pos, tableTitleText));
                        });

                        let docIsBlank = true;
                        doc.forEach((child) => {
                            if (child.type.name !== "paragraph" || child.content.size !== 0)
                                docIsBlank = false;
                        });
                        if (docIsBlank)
                            return DecorationSet.create(doc, [
                                ...hint(0, emptyDocText),
                                ...tableTitleHints,
                            ]);

                        const { $from, empty } = selection;
                        const inEmptyTopLevelParagraph =
                            empty &&
                            $from.depth === 1 &&
                            $from.parent.type.name === "paragraph" &&
                            $from.parent.content.size === 0;

                        if (!inEmptyTopLevelParagraph || !editor.isFocused)
                            return DecorationSet.create(doc, tableTitleHints);

                        return DecorationSet.create(doc, [
                            ...hint($from.before(1), commandHintText, commandHintKey),
                            ...tableTitleHints,
                        ]);
                    },
                },
            }),
        ];
    },
});
