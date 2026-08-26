"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiDownload } from "react-icons/fi";
import { MdClose } from "react-icons/md";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACTION_CHIP =
    "flex size-6 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-snow/8 hover:text-neutral-100";

const GROW = { type: "spring", stiffness: 260, damping: 30 } as const;

const VIEWPORT_FRACTION = 0.7;

type Expansion = {
    top: number;
    left: number;
    width: number;
    height: number;
    fromX: number;
    fromY: number;
    fromScale: number;
};

function expansionFrom(thumbnail: DOMRect): Expansion {
    const aspect = thumbnail.width / thumbnail.height;
    const maxWidth = window.innerWidth * VIEWPORT_FRACTION;
    const maxHeight = window.innerHeight * VIEWPORT_FRACTION;

    let width = maxWidth;
    let height = width / aspect;
    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspect;
    }

    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    return {
        top,
        left,
        width,
        height,
        fromX: thumbnail.left + thumbnail.width / 2 - (left + width / 2),
        fromY: thumbnail.top + thumbnail.height / 2 - (top + height / 2),
        fromScale: thumbnail.width / width,
    };
}

export default function TapToOpenImage({
    src,
    alt,
    fileName,
    className,
}: {
    src: string;
    alt: string;
    fileName: string;
    className?: string;
}) {
    const [expansion, setExpansion] = useState<Expansion | null>(null);
    const thumbnailRef = useRef<HTMLImageElement>(null);

    function expand() {
        const box = thumbnailRef.current?.getBoundingClientRect();
        if (box) setExpansion(expansionFrom(box));
    }

    useEffect(() => {
        if (!expansion) return;
        function onKeyDown(event: KeyboardEvent) {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setExpansion(null);
        }
        window.addEventListener("keydown", onKeyDown, true);
        return () => window.removeEventListener("keydown", onKeyDown, true);
    }, [expansion]);

    return (
        <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                ref={thumbnailRef}
                src={src}
                alt={alt}
                onClick={expand}
                className={cn("block h-auto w-full cursor-zoom-in", className)}
            />

            {typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {expansion && (
                            <motion.div
                                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
                                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                transition={GROW}
                                onClick={() => setExpansion(null)}
                                className="fixed inset-0 z-50 cursor-zoom-out bg-ink/85"
                            >
                                <div
                                    onClick={(event) => event.stopPropagation()}
                                    className="absolute top-4 right-4 flex items-center gap-1"
                                >
                                    <DownloadAction src={src} fileName={fileName} />
                                    <Button
                                        variant="unstyled"
                                        type="button"
                                        aria-label="Close image"
                                        onClick={() => setExpansion(null)}
                                        className={ACTION_CHIP}
                                    >
                                        <MdClose className="size-4" />
                                    </Button>
                                </div>
                                <motion.img
                                    src={src}
                                    alt={alt}
                                    initial={{
                                        x: expansion.fromX,
                                        y: expansion.fromY,
                                        scale: expansion.fromScale,
                                    }}
                                    animate={{ x: 0, y: 0, scale: 1 }}
                                    exit={{
                                        x: expansion.fromX,
                                        y: expansion.fromY,
                                        scale: expansion.fromScale,
                                    }}
                                    transition={GROW}
                                    onClick={(event) => event.stopPropagation()}
                                    style={{
                                        position: "fixed",
                                        top: expansion.top,
                                        left: expansion.left,
                                        width: expansion.width,
                                        height: expansion.height,
                                    }}
                                    className="cursor-default rounded-lg"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}
        </>
    );
}

function DownloadAction({ src, fileName }: { src: string; fileName: string }) {
    const [saving, setSaving] = useState(false);

    async function save() {
        setSaving(true);
        try {
            const response = await fetch(src);
            const blobUrl = URL.createObjectURL(await response.blob());
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(src, "_blank", "noreferrer");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Button
            variant="unstyled"
            type="button"
            loading={saving}
            aria-label={`Download ${fileName}`}
            onClick={save}
            className={ACTION_CHIP}
        >
            <FiDownload className="size-3.5" />
        </Button>
    );
}
