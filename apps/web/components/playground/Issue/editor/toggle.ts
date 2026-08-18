import { mergeAttributes, Node } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ToggleNodeView from "./ToggleNodeView";

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        toggle: {
            setToggle: () => ReturnType;
        };
    }
}

export const ToggleSummary = Node.create({
    name: "toggleSummary",
    content: "inline*",
    defining: true,
    selectable: false,

    parseHTML() {
        return [{ tag: 'div[data-type="toggle-summary"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, { "data-type": "toggle-summary", class: "pl-6" }),
            0,
        ];
    },

    addKeyboardShortcuts() {
        return {
            Enter: ({ editor }) => {
                const { $from } = editor.state.selection;
                if ($from.parent.type.name !== this.name) return false;

                const summaryStart = $from.before($from.depth);
                const bodyStart = summaryStart + $from.parent.nodeSize;

                return editor
                    .chain()
                    .updateAttributes("toggle", { open: true })
                    .command(({ tr, dispatch }) => {
                        if (dispatch)
                            tr.setSelection(TextSelection.near(tr.doc.resolve(bodyStart + 2)));
                        return true;
                    })
                    .focus()
                    .run();
            },
            Backspace: ({ editor }) => {
                const { $from, empty } = editor.state.selection;
                if (!empty || $from.parent.type.name !== this.name) return false;
                if ($from.parent.content.size !== 0) return false;

                const toggle = $from.node($from.depth - 1);
                const togglePos = $from.before($from.depth) - 1;
                const body = toggle.lastChild;
                const bodyIsEmpty =
                    !body || (body.childCount === 1 && body.firstChild?.content.size === 0);
                const replacement = bodyIsEmpty
                    ? editor.schema.nodes.paragraph.create()
                    : body.content;

                return editor
                    .chain()
                    .command(({ tr, dispatch }) => {
                        if (dispatch) {
                            tr.replaceWith(togglePos, togglePos + toggle.nodeSize, replacement);
                            tr.setSelection(TextSelection.near(tr.doc.resolve(togglePos + 1)));
                        }
                        return true;
                    })
                    .focus()
                    .run();
            },
        };
    },
});

export const ToggleBody = Node.create({
    name: "toggleBody",
    content: "block+",
    defining: true,

    parseHTML() {
        return [{ tag: 'div[data-type="toggle-body"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, {
                "data-type": "toggle-body",
                class: "ml-[0.44rem] border-l border-white/10 pl-4",
            }),
            0,
        ];
    },
});

export const Toggle = Node.create({
    name: "toggle",
    group: "block",
    content: "toggleSummary toggleBody",
    defining: true,

    addAttributes() {
        return {
            open: {
                default: true,
                parseHTML: (element) => element.getAttribute("data-open") !== "false",
                renderHTML: (attributes) => ({ "data-open": attributes.open ? "true" : "false" }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="toggle"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ["div", mergeAttributes(HTMLAttributes, { "data-type": "toggle" }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ToggleNodeView);
    },

    addCommands() {
        return {
            setToggle:
                () =>
                ({ tr, state, dispatch }) => {
                    const { $from } = tr.selection;
                    const depth = $from.depth;
                    const blockIsEmpty = $from.parent.content.size === 0;
                    const from = blockIsEmpty ? $from.before(depth) : $from.after(depth);
                    const to = blockIsEmpty ? $from.after(depth) : from;
                    const toggle = state.schema.nodes[this.name].createAndFill();
                    if (!toggle) return false;

                    if (dispatch) {
                        tr.replaceWith(from, to, toggle);
                        tr.setSelection(TextSelection.near(tr.doc.resolve(from + 2)));
                    }
                    return true;
                },
        };
    },
});
