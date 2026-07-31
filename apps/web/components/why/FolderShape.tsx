"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { azeretMono } from "@/components/ui/button";

const TAB_HEIGHT = 26;
const SLANT = 12;
const SHOULDER_RADIUS = 6;
const CORNER_RADIUS = 7;

function folderOutline(w: number, h: number, tabLeft: number, tabWidth: number, closed: boolean) {
    const x0 = 0.5;
    const x1 = w - 0.5;
    const y0 = 0.5;
    const y1 = h - 0.5;
    const y = TAB_HEIGHT + 0.5;
    const r = SHOULDER_RADIUS;
    const c = CORNER_RADIUS;
    const t = tabLeft;
    const tw = tabWidth;
    const len = Math.hypot(SLANT, TAB_HEIGHT);
    const ux = SLANT / len;
    const uy = TAB_HEIGHT / len;
    const p = (n: number) => Number(n.toFixed(2));

    const parts = [
        `M ${x0} ${closed ? p(y1 - c) : h}`,
        `L ${x0} ${p(y + c)}`,
        `Q ${x0} ${y} ${p(x0 + c)} ${y}`,
        `L ${p(t - c)} ${y}`,
        `Q ${t} ${y} ${p(t + c * ux)} ${p(y - c * uy)}`,
        `L ${p(t + SLANT - r * ux)} ${p(y0 + r * uy)}`,
        `Q ${t + SLANT} ${y0} ${t + SLANT + r} ${y0}`,
        `L ${p(t + tw - SLANT - r)} ${y0}`,
        `Q ${p(t + tw - SLANT)} ${y0} ${p(t + tw - SLANT + r * ux)} ${p(y0 + r * uy)}`,
        `L ${p(t + tw - c * ux)} ${p(y - c * uy)}`,
        `Q ${p(t + tw)} ${y} ${p(t + tw + c)} ${y}`,
        `L ${p(x1 - c)} ${y}`,
        `Q ${p(x1)} ${y} ${p(x1)} ${p(y + c)}`,
        `L ${p(x1)} ${closed ? p(y1 - c) : h}`,
    ];
    if (closed) {
        parts.push(
            `Q ${p(x1)} ${p(y1)} ${p(x1 - c)} ${p(y1)}`,
            `L ${p(x0 + c)} ${p(y1)}`,
            `Q ${x0} ${p(y1)} ${x0} ${p(y1 - c)}`,
        );
    }
    return parts.join(" ");
}

export function FolderShape({
    tabLabel,
    tabLeft = 12,
    tabWidth = 132,
    fillClassName,
    strokeClassName,
    labelClassName,
    closedBottom = false,
    className,
    children,
}: {
    tabLabel: string;
    tabLeft?: number;
    tabWidth?: number;
    fillClassName: string;
    strokeClassName: string;
    labelClassName?: string;
    closedBottom?: boolean;
    className?: string;
    children?: ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<{ w: number; h: number } | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            setSize({
                w: Math.round(entry.contentRect.width),
                h: Math.round(entry.contentRect.height),
            });
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const width = size ? Math.min(tabWidth, size.w - tabLeft - SLANT) : tabWidth;
    const outline = size ? folderOutline(size.w, size.h, tabLeft, width, closedBottom) : null;

    return (
        <div ref={ref} className={cn("relative", className)}>
            {outline && size && (
                <svg
                    aria-hidden
                    width={size.w}
                    height={size.h}
                    viewBox={`0 0 ${size.w} ${size.h}`}
                    className="absolute inset-0"
                >
                    <path
                        d={`${outline} Z`}
                        shapeRendering="geometricPrecision"
                        className={cn("stroke-none", fillClassName)}
                    />
                    <path
                        d={closedBottom ? `${outline} Z` : outline}
                        fill="none"
                        strokeWidth="1"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        shapeRendering="geometricPrecision"
                        className={strokeClassName}
                    />
                </svg>
            )}
            <span
                style={{ left: tabLeft, width, height: TAB_HEIGHT }}
                className={cn(
                    "absolute top-0 flex items-center justify-center overflow-hidden whitespace-nowrap px-3 text-[10px] uppercase tracking-widest",
                    azeretMono.className,
                    labelClassName,
                )}
            >
                {tabLabel}
            </span>
            {children && <div className="relative h-full">{children}</div>}
        </div>
    );
}
