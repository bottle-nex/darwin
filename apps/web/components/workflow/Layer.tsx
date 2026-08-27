"use client";

import { ResponsePeriodMarkerIcon } from "@trymatcha/ui/icons";
import {
    animate,
    motion,
    type MotionValue,
    useAnimationFrame,
    useMotionValue,
} from "framer-motion";
import { useEffect, useRef } from "react";

import Node from "./Node";
import type { PositionedNode } from "./types";

const TICK_WIDTH = 8;

function getNowSec(): number {
    const d = new Date();
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000;
}

interface NodeItemProps {
    node: PositionedNode;
    originMinute: number;
    color: string;
    nowSecMv: MotionValue<number>;
    onNodeHover?: (node: PositionedNode) => void;
    onNodeLeave?: () => void;
}

function NodeItem({
    node,
    originMinute,
    color,
    nowSecMv,
    onNodeHover,
    onNodeLeave,
}: NodeItemProps) {
    const targetWidth = (node.endAbs - node.startAbs) * TICK_WIDTH;
    const targetLeft = (node.startAbs - originMinute) * TICK_WIDTH;

    const widthMv = useMotionValue(targetWidth);
    const leftMv = useMotionValue(targetLeft);

    const widthAnimRef = useRef<{ stop: () => void } | null>(null);
    const leftAnimRef = useRef<{ stop: () => void } | null>(null);

    // Running: glue right edge to the RAF clock
    useEffect(() => {
        if (node.status !== "running") return;
        return nowSecMv.on("change", (nowSec) => {
            const endAbs = Math.max(node.startAbs + node.estimatedMinutes, nowSec);
            widthMv.set((endAbs - node.startAbs) * TICK_WIDTH);
        });
    }, [node.status, nowSecMv, widthMv, node.startAbs, node.estimatedMinutes]);

    // Done: smooth shrink to actual width. Pending: snap immediately.
    useEffect(() => {
        widthAnimRef.current?.stop();
        if (node.status === "done") {
            widthAnimRef.current = animate(widthMv, targetWidth, {
                duration: 0.35,
                ease: "easeOut",
            });
        } else if (node.status === "pending") {
            widthMv.set(targetWidth);
        }
    }, [node.status, targetWidth, widthMv]);

    // Smooth left shift when upstream node overruns
    useEffect(() => {
        leftAnimRef.current?.stop();
        leftAnimRef.current = animate(leftMv, targetLeft, {
            type: "spring",
            stiffness: 300,
            damping: 28,
        });
    }, [targetLeft, leftMv]);

    const hasPeriods = node.status === "done" && (node.responsePeriods?.length ?? 0) > 0;

    return (
        <motion.div
            className="absolute top-0 bottom-0"
            style={{ left: leftMv, width: widthMv, zIndex: 1 }}
            onHoverStart={() => hasPeriods && onNodeHover?.(node)}
            onHoverEnd={() => onNodeLeave?.()}
        >
            <Node name={node.issueName} status={node.status} color={color} />

            {/* Response period indicators — colored star icons at each period's midpoint */}
            {hasPeriods &&
                node.responsePeriods!.map((period) => {
                    const cx = ((period.startOffset + period.endOffset) / 2) * TICK_WIDTH;
                    return (
                        <div
                            key={period.id}
                            className="absolute pointer-events-none flex items-center justify-center"
                            style={{
                                left: cx - 9,
                                top: "50%",
                                transform: "translateY(-50%)",
                                zIndex: 3,
                                filter: "drop-shadow(0 0 4px " + period.color + "99)",
                            }}
                        >
                            <ResponsePeriodMarkerIcon
                                size={14}
                                fill={period.color}
                                color={period.color}
                            />
                        </div>
                    );
                })}
        </motion.div>
    );
}

interface LayerProps {
    nodes: PositionedNode[];
    originMinute: number;
    height?: number;
    color?: string;
    onNodeHover?: (node: PositionedNode) => void;
    onNodeLeave?: () => void;
}

export default function Layer({
    nodes,
    originMinute,
    height = 52,
    color = "rgba(255,255,255,0.18)",
    onNodeHover,
    onNodeLeave,
}: LayerProps) {
    const nowSecMv = useMotionValue(getNowSec());
    useAnimationFrame(() => {
        nowSecMv.set(getNowSec());
    });

    return (
        <div className="relative w-full shrink-0" style={{ height, marginBottom: 10 }}>
            <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: 1.5,
                    background:
                        "repeating-linear-gradient(to right, " +
                        color +
                        " 0px, " +
                        color +
                        " 8px, transparent 8px, transparent 16px)",
                    zIndex: 0,
                }}
            />
            {nodes.map((node) => (
                <NodeItem
                    key={node.id}
                    node={node}
                    originMinute={originMinute}
                    color={color}
                    nowSecMv={nowSecMv}
                    onNodeHover={onNodeHover}
                    onNodeLeave={onNodeLeave}
                />
            ))}
        </div>
    );
}
