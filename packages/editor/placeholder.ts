import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface EditorPlaceholderOptions {
    emptyDocText: string;
    commandHintText: string;
    tableTitleText: string;
}

function hint(pos: number, size: number, text: string) {
    return Decoration.node(pos, pos + size, {
        class: "editor-placeholder",
        "data-placeholder": text,
    });
}

export const EditorPlaceholder = Extension.create<EditorPlaceholderOptions>({
    name: "editorPlaceholder",

    addOptions() {
        return {
            emptyDocText: "Add a description...",
            commandHintText: "Type / for commands",
            tableTitleText: "Table title",
        };
    },

    addProseMirrorPlugins() {
        const { emptyDocText, commandHintText, tableTitleText } = this.options;
        const editor = this.editor;

        return [
            new Plugin({
                key: new PluginKey("editorPlaceholder"),
                props: {
                    decorations: (state) => {
                        const { doc, selection } = state;

                        const tableTitleHints: Decoration[] = [];
                        doc.descendants((node, pos) => {
                            if (node.type.name === "tableTitle" && node.content.size === 0)
                                tableTitleHints.push(hint(pos, node.nodeSize, tableTitleText));
                        });

                        let docIsBlank = true;
                        doc.forEach((child) => {
                            if (child.type.name !== "paragraph" || child.content.size !== 0)
                                docIsBlank = false;
                        });
                        if (docIsBlank)
                            return DecorationSet.create(doc, [
                                hint(0, 2, emptyDocText),
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
                            hint($from.before(1), 2, commandHintText),
                            ...tableTitleHints,
                        ]);
                    },
                },
            }),
        ];
    },
});
