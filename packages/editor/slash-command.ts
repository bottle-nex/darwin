import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";

import {
    isSlashCommandDateInsert,
    isSlashCommandSizedInsert,
    SLASH_COMMAND_ENTRIES,
    SLASH_COMMAND_ITEMS,
    type SlashCommandSelection,
} from "./commandItems";
import SlashCommandList, { type SlashCommandListHandle } from "./SlashCommandList";

export const SlashCommand = Extension.create({
    name: "slashCommand",

    addOptions() {
        return {
            suggestion: {
                char: "/",
                startOfLine: false,
                floatingUi: { strategy: "fixed" },
                command: ({ editor, range, props }) => {
                    const selection = props as SlashCommandSelection;
                    if (isSlashCommandDateInsert(selection))
                        selection.insertDate({
                            editor,
                            range,
                            iso: selection.datetime?.iso ?? new Date().toISOString(),
                            mode: selection.datetime?.mode ?? "datetime",
                        });
                    else if (isSlashCommandSizedInsert(selection))
                        selection.insert({
                            editor,
                            range,
                            rows: selection.size?.rows ?? 1,
                            cols: selection.size?.cols ?? 1,
                        });
                    else if (!("items" in selection)) selection.command({ editor, range });
                },
            } satisfies Partial<SuggestionOptions<SlashCommandSelection>>,
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion<SlashCommandSelection>({
                editor: this.editor,
                ...this.options.suggestion,
                items: ({ query }) =>
                    query
                        ? SLASH_COMMAND_ITEMS.filter((item) =>
                              item.title.toLowerCase().includes(query.toLowerCase()),
                          )
                        : SLASH_COMMAND_ENTRIES,
                render: () => {
                    let component: ReactRenderer<SlashCommandListHandle>;
                    let unmount: (() => void) | undefined;

                    return {
                        onStart: (props) => {
                            component = new ReactRenderer(SlashCommandList, {
                                props,
                                editor: props.editor,
                                className: "z-[100]",
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
