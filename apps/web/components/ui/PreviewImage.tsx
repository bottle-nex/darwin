"use client";
import Image from "next/image";

import { cn } from "@/lib/utils";

const SNOW_WASH =
    "radial-gradient(85% 85% at 14% 10%, color-mix(in srgb, var(--color-snow) 97%, var(--color-edge)) 0%, transparent 62%)," +
    "linear-gradient(140deg, color-mix(in srgb, var(--color-snow) 93%, var(--color-edge)) 0%, color-mix(in srgb, var(--color-snow) 82%, var(--color-edge)) 100%)";

export default function PreviewImage({
    src,
    alt,
    width,
    height,
    priority,
    sizes,
    inset = "9%",
    className,
}: {
    src: string;
    alt: string;
    width: number;
    height: number;
    priority?: boolean;
    sizes?: string;
    inset?: string;
    className?: string;
}) {
    return (
        <div
            style={{ background: SNOW_WASH }}
            className={cn(
                "relative aspect-16/10 overflow-hidden rounded-xl border border-border",
                className,
            )}
        >
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                priority={priority}
                sizes={sizes}
                style={{ top: inset, left: inset }}
                className="absolute w-full max-w-none rounded-tl-xl shadow-xl shadow-[var(--shadow-dialog)] ring-1 ring-edge select-none"
            />
        </div>
    );
}
