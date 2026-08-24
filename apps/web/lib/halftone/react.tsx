"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import type { HalftoneInstance, HalftoneOptions } from "./hero-engine";
import { createHalftone } from "./hero-engine";

export type HalftoneProps = HalftoneOptions & {
    className?: string;
    style?: React.CSSProperties;
};

export type HalftoneRef = {
    exportPNG: (filename?: string) => void;
};

/**
 * Twenty-style halftone of an image. The canvas fills this component's box —
 * give it a sized wrapper (or pass width/height via `style`).
 *
 *   <div style={{ width: 600, height: 600 }}>
 *     <Halftone src="/logo.png" ink="#4a38f5" />
 *   </div>
 *
 * Next.js: client component. Use inside another "use client" component, or
 * next/dynamic with { ssr: false } from a server page.
 */
export const Halftone = forwardRef<HalftoneRef, HalftoneProps>(function Halftone(props, ref) {
    const { className, style, ...options } = props;
    const containerRef = useRef<HTMLDivElement>(null);
    const instRef = useRef<HalftoneInstance | null>(null);

    // create once
    useEffect(() => {
        if (!containerRef.current) return;
        instRef.current = createHalftone(containerRef.current, options);
        return () => {
            instRef.current?.destroy();
            instRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // push prop changes
    useEffect(() => {
        instRef.current?.update(options);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        options.src,
        options.ink,
        options.hoverColor,
        options.tile,
        options.power,
        options.width,
        options.contrast,
        options.invert,
        options.cropToBounds,
        options.hover,
        options.hoverRadius,
        options.hoverIntensity,
        options.previewDistance,
        options.verticalAnchor,
        options.horizontalOffsetPx,
        options.verticalOffsetPx,
    ]);

    useImperativeHandle(ref, () => ({
        exportPNG: (filename?: string) => instRef.current?.exportPNG(filename),
    }));

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ width: "100%", height: "100%", ...style }}
        />
    );
});
