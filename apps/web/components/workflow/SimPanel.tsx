"use client";

import { Button } from "@/components/ui/button";
import type { WorkerDef, PositionedNode } from "./types";

interface SimPanelProps {
    workers: WorkerDef[];
    positioned: PositionedNode[];
    isStarted: boolean;
    onStart: () => void;
    onEndNode: (workerId: string) => void;
    activeResponseWorkers: string[];
    onActionToggle: (workerId: string) => void;
}

export default function SimPanel({
    workers,
    positioned,
    isStarted,
    onStart,
    onEndNode,
    activeResponseWorkers,
    onActionToggle,
}: SimPanelProps) {
    return (
        <div className="fixed bottom-6 right-6 z-50" style={{ minWidth: 272 }}>
            <div
                className="flex flex-col rounded-2xl p-4"
                style={{
                    background: "rgba(10,10,10,0.92)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                }}
            >
                <p
                    className="text-white/30 font-mono uppercase tracking-widest mb-3"
                    style={{ fontSize: 10 }}
                >
                    Simulate
                </p>

                {!isStarted ? (
                    <Button
                        variant="unstyled"
                        onClick={onStart}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white w-full"
                        style={{ background: "#16a34a" }}
                    >
                        Start all workers
                    </Button>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        {workers.map((worker) => {
                            const running = positioned.find(
                                (n) => n.workerId === worker.id && n.status === "running",
                            );
                            const isResponding = activeResponseWorkers.includes(worker.id);

                            return (
                                <div key={worker.id} className="flex items-center gap-1.5">
                                    {/* Worker label */}
                                    <div
                                        className="flex items-center gap-1.5 flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs"
                                        style={{
                                            background: running
                                                ? worker.color + "18"
                                                : "rgba(255,255,255,0.03)",
                                            border:
                                                "1px solid " +
                                                (running
                                                    ? worker.color + "33"
                                                    : "rgba(255,255,255,0.05)"),
                                            color: running ? "white" : "rgba(255,255,255,0.2)",
                                        }}
                                    >
                                        <span
                                            className="shrink-0 rounded-full"
                                            style={{
                                                width: 6,
                                                height: 6,
                                                background: running
                                                    ? worker.color
                                                    : "rgba(255,255,255,0.15)",
                                            }}
                                        />
                                        <span className="truncate font-medium">
                                            {worker.name}
                                            {running && (
                                                <span
                                                    style={{
                                                        opacity: 0.5,
                                                        fontWeight: 400,
                                                        marginLeft: 5,
                                                    }}
                                                >
                                                    {running.issueName}
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    {running && (
                                        <>
                                            {/* Action required toggle */}
                                            <Button
                                                variant="unstyled"
                                                onClick={() => onActionToggle(worker.id)}
                                                className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium whitespace-nowrap"
                                                style={{
                                                    background: isResponding
                                                        ? "rgba(251,146,60,0.18)"
                                                        : "rgba(255,255,255,0.06)",
                                                    border:
                                                        "1px solid " +
                                                        (isResponding
                                                            ? "rgba(251,146,60,0.45)"
                                                            : "rgba(255,255,255,0.08)"),
                                                    color: isResponding
                                                        ? "#fb923c"
                                                        : "rgba(255,255,255,0.4)",
                                                }}
                                            >
                                                {isResponding ? "● Stop" : "Action"}
                                            </Button>

                                            {/* End node */}
                                            <Button
                                                variant="unstyled"
                                                onClick={() => onEndNode(worker.id)}
                                                className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold text-white whitespace-nowrap"
                                                style={{
                                                    background: worker.color + "22",
                                                    border: "1px solid " + worker.color + "55",
                                                }}
                                            >
                                                End
                                            </Button>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
