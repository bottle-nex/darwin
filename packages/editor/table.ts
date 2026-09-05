import { mergeAttributes, Node } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        tableFigure: {
            insertTableFigure: (options: { rows: number; cols: number }) => ReturnType;
        };
    }
}

export const TableTitle = Node.create({
    name: "tableTitle",
    content: "inline*",
    defining: true,

    parseHTML() {
        return [{ tag: 'figcaption[data-type="table-title"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "figcaption",
            mergeAttributes(HTMLAttributes, {
                "data-type": "table-title",
                class: "mb-1 text-[13px] font-medium text-neutral-300",
            }),
            0,
        ];
    },
});

export const TableFigure = Node.create({
    name: "tableFigure",
    group: "block",
    content: "tableTitle table",
    defining: true,
    isolating: true,

    parseHTML() {
        return [{ tag: 'figure[data-type="table-figure"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "figure",
            mergeAttributes(HTMLAttributes, {
                "data-type": "table-figure",
                class: "my-3",
            }),
            0,
        ];
    },

    addCommands() {
        return {
            insertTableFigure:
                ({ rows, cols }) =>
                ({ tr, state, dispatch }) => {
                    const { schema } = state;
                    const cell = () => schema.nodes.paragraph.create();
                    const row = (type: "tableHeader" | "tableCell") =>
                        schema.nodes.tableRow.create(
                            null,
                            Array.from({ length: cols }, () =>
                                schema.nodes[type].create(null, cell()),
                            ),
                        );

                    const table = schema.nodes.table.create(null, [
                        row("tableHeader"),
                        ...Array.from({ length: rows }, () => row("tableCell")),
                    ]);
                    const figure = schema.nodes[this.name].create(null, [
                        schema.nodes.tableTitle.create(),
                        table,
                    ]);

                    const { $from } = tr.selection;
                    const blockIsEmpty = $from.parent.content.size === 0;
                    const from = blockIsEmpty
                        ? $from.before($from.depth)
                        : $from.after($from.depth);
                    const to = blockIsEmpty ? $from.after($from.depth) : from;

                    if (dispatch) {
                        tr.replaceWith(from, to, figure);
                        tr.setSelection(TextSelection.near(tr.doc.resolve(from + 2)));
                    }
                    return true;
                },
        };
    },
});
