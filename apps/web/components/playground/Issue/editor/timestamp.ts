import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { formatDate } from "@/lib/format";

import TimestampNodeView from "./TimestampNodeView";

export type TimestampMode = "date" | "time" | "datetime";

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        timestamp: {
            insertTimestamp: (options: { iso: string; mode: TimestampMode }) => ReturnType;
        };
    }
}

function formatTime(value: Date) {
    return value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatTimestamp(iso: string, mode: TimestampMode) {
    const value = new Date(iso);
    if (mode === "date") return formatDate(value);
    if (mode === "time") return formatTime(value);
    return `${formatDate(value)}, ${formatTime(value)}`;
}

export const Timestamp = Node.create({
    name: "timestamp",
    inline: true,
    group: "inline",
    atom: true,
    selectable: true,

    addAttributes() {
        return {
            value: {
                default: "",
                parseHTML: (element) => element.getAttribute("datetime") ?? "",
                renderHTML: (attributes) => ({ datetime: attributes.value }),
            },
            mode: {
                default: "datetime",
                parseHTML: (element) => element.getAttribute("data-mode") ?? "datetime",
                renderHTML: (attributes) => ({ "data-mode": attributes.mode }),
            },
        };
    },

    parseHTML() {
        return [{ tag: "time[datetime]" }];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            "time",
            mergeAttributes(HTMLAttributes, { class: "timestamp-chip" }),
            formatTimestamp(node.attrs.value, node.attrs.mode),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(TimestampNodeView);
    },

    addCommands() {
        return {
            insertTimestamp:
                ({ iso, mode }) =>
                ({ commands }) =>
                    commands.insertContent({ type: this.name, attrs: { value: iso, mode } }),
        };
    },
});
