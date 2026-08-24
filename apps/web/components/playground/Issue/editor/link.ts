import { Extension } from "@tiptap/core";
import { type EditorState, Plugin, PluginKey } from "@tiptap/pm/state";

import { isUrl, withProtocol } from "@/lib/urls";

export interface LinkPromptRequest {
    from: number;
    to: number;
    label: string;
    href: string;
}

export const LINK_ATTRIBUTES = {
    target: "_blank",
    rel: "noopener noreferrer nofollow",
};

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        linkPrompt: {
            openLinkPrompt: () => ReturnType;
        };
    }
}

function hrefAt(state: EditorState, from: number) {
    const mark = state.doc
        .resolve(from)
        .marks()
        .find((mark) => mark.type.name === "link");
    return (mark?.attrs.href as string | undefined) ?? "";
}

export const LinkPrompt = Extension.create<{
    onRequest?: (request: LinkPromptRequest) => void;
}>({
    name: "linkPrompt",

    addOptions() {
        return { onRequest: undefined };
    },

    addCommands() {
        return {
            openLinkPrompt:
                () =>
                ({ state }) => {
                    const { from, to } = state.selection;
                    this.options.onRequest?.({
                        from,
                        to,
                        label: state.doc.textBetween(from, to),
                        href: hrefAt(state, from),
                    });
                    return true;
                },
        };
    },

    addProseMirrorPlugins() {
        const request = (value: LinkPromptRequest) => this.options.onRequest?.(value);

        return [
            new Plugin({
                key: new PluginKey("linkPromptPaste"),
                props: {
                    handlePaste: (view, event) => {
                        const pasted = event.clipboardData?.getData("text/plain")?.trim();
                        if (!pasted || !isUrl(pasted)) return false;

                        const href = withProtocol(pasted);
                        const { from, to, empty } = view.state.selection;

                        if (!empty) {
                            this.editor.chain().focus().setLink({ href }).run();
                            request({
                                from,
                                to,
                                label: view.state.doc.textBetween(from, to),
                                href,
                            });
                            return true;
                        }

                        this.editor
                            .chain()
                            .focus()
                            .insertContentAt(from, {
                                type: "text",
                                text: pasted,
                                marks: [{ type: "link", attrs: { href } }],
                            })
                            .run();
                        request({ from, to: from + pasted.length, label: "", href });
                        return true;
                    },
                },
            }),
        ];
    },
});
