"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { CloseIcon, ExpandImageIcon } from "@trydarwin/ui/icons";
import { useState } from "react";

import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { cn } from "./lib/cn";

export default function ImageNodeView({ node, deleteNode, selected }: ReactNodeViewProps) {
    const [zoomOpen, setZoomOpen] = useState(false);
    const src = node.attrs.src as string;
    const alt = (node.attrs.alt as string | null) ?? "";

    return (
        <NodeViewWrapper
            as="span"
            className={cn(
                "image-node group relative inline-block align-top",
                selected && "rounded-lg ring-2 ring-primary",
            )}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="block h-auto w-full rounded-lg" />
            <span className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                    variant="unstyled"
                    type="button"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={() => setZoomOpen(true)}
                    aria-label="Zoom image"
                    className="flex size-6 cursor-pointer items-center justify-center rounded-md bg-overlay/60 text-ink hover:bg-overlay/80"
                >
                    <ExpandImageIcon className="size-3.5" />
                </Button>
                <Button
                    variant="unstyled"
                    type="button"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={() => deleteNode()}
                    aria-label="Delete image"
                    className="flex size-6 cursor-pointer items-center justify-center rounded-md bg-overlay/60 text-ink hover:bg-rose-500/80"
                >
                    <CloseIcon className="size-3.5" />
                </Button>
            </span>
            <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
                <DialogContent
                    showCloseButton
                    className="w-fit max-w-[90vw] border-none bg-transparent p-0 shadow-none sm:max-w-[90vw]"
                >
                    <DialogTitle className="sr-only">Image preview</DialogTitle>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={alt} className="max-h-[85vh] w-auto rounded-lg" />
                </DialogContent>
            </Dialog>
        </NodeViewWrapper>
    );
}
