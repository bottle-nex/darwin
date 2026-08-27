"use client";

import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { DropdownCaretIcon } from "@trymatcha/ui/icons";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ToggleNodeView({ node, updateAttributes, editor }: ReactNodeViewProps) {
    const open = node.attrs.open as boolean;

    return (
        <NodeViewWrapper
            data-type="toggle"
            data-open={open ? "true" : "false"}
            className="relative [&[data-open=false]_[data-type=toggle-body]]:hidden"
        >
            <Button
                variant="unstyled"
                type="button"
                contentEditable={false}
                disabled={!editor.isEditable}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => updateAttributes({ open: !open })}
                aria-label={open ? "Collapse toggle" : "Expand toggle"}
                aria-expanded={open}
                className="absolute top-[0.35rem] left-0 flex size-4 cursor-pointer items-center justify-center rounded-[3px] text-neutral-500 transition-colors hover:bg-white/10 hover:text-neutral-200"
            >
                <DropdownCaretIcon
                    className={cn("size-3 transition-transform", !open && "-rotate-90")}
                />
            </Button>
            <NodeViewContent />
        </NodeViewWrapper>
    );
}
