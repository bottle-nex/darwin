import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import SlashCommandList, { type SlashCommandListHandle } from "./SlashCommandList";
import { SLASH_COMMAND_ITEMS, type SlashCommandItem } from "./commandItems";

export const SlashCommand = Extension.create({
    name: "slashCommand",

    addOptions() {
        return {
            suggestion: {
                char: "/",
                startOfLine: false,
                command: ({ editor, range, props }) => {
                    (props as SlashCommandItem).command({ editor, range });
                },
            } satisfies Partial<SuggestionOptions<SlashCommandItem>>,
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion<SlashCommandItem>({
                editor: this.editor,
                ...this.options.suggestion,
                items: ({ query }) =>
                    SLASH_COMMAND_ITEMS.filter((item) =>
                        item.title.toLowerCase().includes(query.toLowerCase()),
                    ),
                render: () => {
                    let component: ReactRenderer<SlashCommandListHandle>;
                    let unmount: (() => void) | undefined;

                    return {
                        onStart: (props) => {
                            component = new ReactRenderer(SlashCommandList, {
                                props,
                                editor: props.editor,
                            });
                            unmount = props.mount(component.element as HTMLElement);
                        },
                        onUpdate: (props) => {
                            component.updateProps(props);
                        },
                        onKeyDown: (props) => {
                            if (props.event.key === "Escape") {
                                unmount?.();
                                return true;
                            }
                            return component.ref?.onKeyDown(props) ?? false;
                        },
                        onExit: () => {
                            unmount?.();
                            component.destroy();
                        },
                    };
                },
            }),
        ];
    },
});
