import type { NodeStatus } from "./types";

interface NodeProps {
    name: string;
    status: NodeStatus;
    color?: string;
}

export default function Node({ name, status, color = "rgba(255,255,255,0.85)" }: NodeProps) {
    const isRunning = status === "running";
    const isDone = status === "done";

    return (
        <div
            className="flex items-center justify-between h-full rounded-md overflow-hidden px-3 gap-2"
            style={{
                background: "#0e0e0e",
                border: "1px solid rgba(255,255,255,0.15)",
            }}
        >
            <span
                className="text-white truncate select-none"
                style={{
                    fontSize: 11,
                    letterSpacing: "0.02em",
                    opacity: isDone ? 0.45 : isRunning ? 0.9 : 0.3,
                }}
            >
                {name}
            </span>

            <div className="shrink-0" style={{ width: 28, height: 28, position: "relative" }}>
                {/* Base ring */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        border:
                            "2px solid " +
                            (isDone ? color : isRunning ? color : "rgba(255,255,255,0.18)"),
                        opacity: isDone ? 0.65 : 1,
                    }}
                />
                {/* Inner fill for done */}
                {isDone && (
                    <div
                        className="absolute rounded-full"
                        style={{ inset: 6, background: color, opacity: 0.5 }}
                    />
                )}
                {/* Spinner arc for running */}
                {isRunning && (
                    <div
                        className="absolute inset-0 rounded-full animate-spin"
                        style={{
                            border: "2px solid transparent",
                            borderTopColor: color,
                            borderRightColor: color,
                        }}
                    />
                )}
            </div>
        </div>
    );
}
