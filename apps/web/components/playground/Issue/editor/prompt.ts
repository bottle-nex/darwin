import { InputRule, Mark, Node, mergeAttributes, type Editor } from "@tiptap/core";
import { BLANK_QUESTION } from "@/lib/templates/promptHtml";

const PROMPT_NAME = "prompt";
const BRACES = /\{\{([^}]*)\}\}$/;
const PROMPT_TAGS = [{ tag: "span.prompt" }, { tag: "span[data-prompt]" }];

export const PromptMark = Mark.create({
    name: PROMPT_NAME,
    inclusive: true,

    parseHTML() {
        return PROMPT_TAGS;
    },

    renderHTML({ HTMLAttributes }) {
        return ["span", mergeAttributes(HTMLAttributes, { class: "prompt" }), 0];
    },

    addInputRules() {
        return [
            new InputRule({
                find: BRACES,
                handler: ({ chain, range, match }) => {
                    const typed = match[1].trim();
                    const question = typed || BLANK_QUESTION;
                    const start = range.from;
                    const end = start + question.length;

                    chain()
                        .insertContentAt(range, [
                            { type: "text", text: question, marks: [{ type: PROMPT_NAME }] },
                        ])
                        .setTextSelection(typed ? end : { from: start, to: end })
                        .run();
                },
            }),
        ];
    },

    addKeyboardShortcuts() {
        return {
            Escape: () => {
                if (!this.editor.isActive(PROMPT_NAME)) return false;

                const { state, view } = this.editor;
                const marks = state.selection.$from
                    .marks()
                    .filter((mark) => mark.type.name !== PROMPT_NAME);

                view.dispatch(state.tr.setStoredMarks(marks));
                return true;
            },
        };
    },
});

export const Prompt = Node.create({
    name: PROMPT_NAME,
    inline: true,
    group: "inline",
    atom: true,
    selectable: true,

    addAttributes() {
        return {
            text: {
                default: "",
                parseHTML: (element) =>
                    element.getAttribute("data-prompt") || (element.textContent ?? ""),
                renderHTML: (attributes) => ({ "data-prompt": attributes.text }),
            },
        };
    },

    parseHTML() {
        return PROMPT_TAGS;
    },

    renderHTML({ node, HTMLAttributes }) {
        return ["span", mergeAttributes(HTMLAttributes, { class: "prompt" }), node.attrs.text];
    },

    addInputRules() {
        return [
            new InputRule({
                find: BRACES,
                handler: ({ state, range, match }) => {
                    state.tr.replaceWith(
                        range.from,
                        range.to,
                        this.type.create({ text: match[1].trim() || BLANK_QUESTION }),
                    );
                },
            }),
        ];
    },
});

export function countPrompts(editor: Editor): number {
    let prompts = 0;
    editor.state.doc.descendants((node) => {
        if (node.type.name === PROMPT_NAME) prompts += 1;
    });
    return prompts;
}
