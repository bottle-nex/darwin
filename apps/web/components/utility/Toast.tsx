"use client";
import type { IconType } from "@trymatcha/ui/icons";
import {
    CloseIcon,
    ErrorCircleIcon,
    StatusInfoIcon,
    SuccessCircleIcon,
    ToastDefaultIcon,
    ToastWarningIcon,
} from "@trymatcha/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast/useToastStore";
import type { ToastItem, ToastPosition, ToastStatus } from "@/types/toast.type";

const EASE = [0.22, 1, 0.36, 1] as const;
const DEFAULT_DURATION_MS = 4000;
const CARD_GAP = 10;
const STACK_PEEK_OFFSET = 14;
const STACK_SCALE_STEP = 0.05;
const MAX_STACK_DEPTH = 3;

const POSITIONS: ToastPosition[] = [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
];

const VIEWPORT_CLASSES: Record<ToastPosition, string> = {
    "top-left": "top-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
};

const STATUS_CONFIG: Record<ToastStatus, { icon: IconType; iconClassName: string }> = {
    default: { icon: ToastDefaultIcon, iconClassName: "text-neutral-300" },
    success: { icon: SuccessCircleIcon, iconClassName: "text-matcha" },
    info: { icon: StatusInfoIcon, iconClassName: "text-blue-400" },
    warning: { icon: ToastWarningIcon, iconClassName: "text-yellow-400" },
    error: { icon: ErrorCircleIcon, iconClassName: "text-rose-500" },
};

type ToasterProps = {
    position?: ToastPosition;
};

export function Toaster({ position = "bottom-right" }: ToasterProps) {
    const items = useToastStore((s) => s.items);

    return (
        <>
            {POSITIONS.map((viewportPosition) => {
                const toasts = items.filter(
                    (item) => (item.position ?? position) === viewportPosition,
                );
                if (toasts.length === 0) return null;

                return (
                    <ToastViewport
                        key={viewportPosition}
                        position={viewportPosition}
                        toasts={toasts}
                    />
                );
            })}
        </>
    );
}

type ToastViewportProps = {
    position: ToastPosition;
    toasts: ToastItem[];
};

function ToastViewport({ position, toasts }: ToastViewportProps) {
    const [expanded, setExpanded] = useState(false);
    const [heights, setHeights] = useState<Record<string, number>>({});
    const isTop = position.startsWith("top");

    const reportHeight = useCallback((id: string, height: number) => {
        setHeights((prev) => (prev[id] === height ? prev : { ...prev, [id]: height }));
    }, []);

    const prefixHeights = toasts.reduce<number[]>((sums, toast) => {
        const previous = sums.at(-1) ?? 0;
        const height = heights[toast.id] ?? 0;
        return [...sums, previous + height + CARD_GAP];
    }, []);

    const stack = toasts.map((toast, index) => {
        const collapsedOffset = Math.min(index, MAX_STACK_DEPTH - 1) * STACK_PEEK_OFFSET;
        const expandedOffset = index === 0 ? 0 : prefixHeights[index - 1];

        return {
            toast,
            y: (isTop ? 1 : -1) * (expanded ? expandedOffset : collapsedOffset),
            scale: expanded ? 1 : Math.max(1 - index * STACK_SCALE_STEP, 0.85),
            opacity: expanded || index < MAX_STACK_DEPTH ? 1 : 0,
            zIndex: toasts.length - index,
        };
    });

    const frontHeight = heights[toasts[0]?.id] ?? 64;
    const peekDepth = Math.min(toasts.length - 1, MAX_STACK_DEPTH - 1);
    const collapsedHeight = frontHeight + peekDepth * STACK_PEEK_OFFSET;
    const cumulativeTotal = prefixHeights.at(-1) ?? 0;
    const expandedHeight = Math.max(cumulativeTotal - CARD_GAP, frontHeight);
    const containerHeight = expanded ? Math.max(expandedHeight, collapsedHeight) : collapsedHeight;

    return (
        <div
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
            style={{ height: containerHeight }}
            className={cn("pointer-events-none fixed z-9999 w-86", VIEWPORT_CLASSES[position])}
        >
            <AnimatePresence>
                {stack.map(({ toast, y, scale, opacity, zIndex }) => (
                    <ToastCard
                        key={toast.id}
                        toast={toast}
                        position={position}
                        isTop={isTop}
                        onHeightChange={reportHeight}
                        stackY={y}
                        stackScale={scale}
                        stackOpacity={opacity}
                        zIndex={zIndex}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

type ToastCardProps = {
    toast: ToastItem;
    position: ToastPosition;
    isTop: boolean;
    onHeightChange: (id: string, height: number) => void;
    stackY: number;
    stackScale: number;
    stackOpacity: number;
    zIndex: number;
};

function ToastCard({
    toast,
    position,
    isTop,
    onHeightChange,
    stackY,
    stackScale,
    stackOpacity,
    zIndex,
}: ToastCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [paused, setPaused] = useState(false);
    const reduceMotion = useReducedMotion();
    const dismiss = useToastStore((s) => s.dismiss);
    const duration = toast.duration ?? DEFAULT_DURATION_MS;
    const horizontal = position.split("-")[1];
    const { icon: Icon, iconClassName } = STATUS_CONFIG[toast.status ?? "default"];
    const onDismiss = () => dismiss(toast.id);

    useEffect(() => {
        if (paused || duration <= 0) return;
        const timer = setTimeout(() => dismiss(toast.id), duration);
        return () => clearTimeout(timer);
    }, [paused, duration, dismiss, toast.id]);

    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) =>
            onHeightChange(toast.id, entry.contentRect.height),
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [toast.id, onHeightChange]);

    const slideX = horizontal === "left" ? -40 : horizontal === "right" ? 40 : 0;
    const slideY = horizontal === "center" ? (isTop ? -24 : 24) : 0;

    return (
        <motion.div
            ref={cardRef}
            initial={
                reduceMotion ? false : { opacity: 0, x: slideX, y: stackY + slideY, scale: 0.96 }
            }
            animate={{ opacity: stackOpacity, x: 0, y: stackY, scale: stackScale }}
            exit={
                reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.9, transition: { duration: 0.15 } }
            }
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            style={{
                position: "absolute",
                [isTop ? "top" : "bottom"]: 0,
                left: 0,
                right: 0,
                zIndex,
                pointerEvents: stackOpacity === 0 ? "none" : "auto",
            }}
            className="group overflow-hidden rounded-lg bg-cement shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_0_var(--color-edge)]"
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "linear-gradient(115deg, transparent 46%, rgba(255,255,255,0.05) 100%, transparent 54%)",
                }}
            />

            <div className="relative flex items-start gap-3 p-3.5 pr-9">
                <Icon className={cn("mt-0.5 size-5 shrink-0", iconClassName)} aria-hidden />

                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[13px] font-medium text-neutral-100">{toast.title}</span>
                    {toast.description && (
                        <span className="mt-0.5 text-[12.5px] leading-snug text-neutral-400">
                            {toast.description}
                        </span>
                    )}
                </span>

                {toast.action && (
                    <button
                        type="button"
                        onClick={() => {
                            toast.action?.onClick();
                            onDismiss();
                        }}
                        className="shrink-0 self-center rounded-md bg-white/8 px-3 py-1.5 text-xs font-medium text-neutral-100 transition-colors hover:bg-white/12"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>

            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss notification"
                className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-md text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/6 hover:text-neutral-200 focus-visible:opacity-100 focus-visible:outline-none"
            >
                <CloseIcon className="size-3" aria-hidden />
            </button>
        </motion.div>
    );
}
