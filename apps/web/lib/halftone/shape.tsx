"use client";

import { useEffect, useRef } from "react";
import { createHalftoneShape, HalftoneShapeInstance, HalftoneShapeOptions } from "./shape-engine";

export type HalftoneShapeProps = HalftoneShapeOptions & {
    className?: string;
    style?: React.CSSProperties;
};

/**
 * Twenty-style halftone of a spinning, drag-rotatable extruded SVG. The canvas
 * fills this component's box — give it a sized wrapper.
 *
 *   <div style={{ width: 360, height: 320 }}>
 *     <HalftoneShape src="/icon.svg" ink="#4a38f5" />
 *   </div>
 */
export function HalftoneShape(props: HalftoneShapeProps) {
    const { className, style, ...options } = props;
    const containerRef = useRef<HTMLDivElement>(null);
    const instRef = useRef<HalftoneShapeInstance | null>(null);

    // create once
    useEffect(() => {
        if (!containerRef.current) return;
        instRef.current = createHalftoneShape(containerRef.current, options);
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
        options.invert,
        options.extrudeDepth,
        options.autoSpin,
        options.tiltX,
        options.hover,
        options.hoverRadius,
        options.hoverIntensity,
    ]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ width: "100%", height: "100%", ...style }}
        />
    );
}
