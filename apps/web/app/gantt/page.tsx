"use client";

import { useState, useEffect, useCallback } from "react";
import Timeline, { type TimelineMarker } from "@/components/workflow/Timeline";
import Layer from "@/components/workflow/Layer";
import Sidebar from "@/components/workflow/Sidebar";
import SimPanel from "@/components/workflow/SimPanel";
import { computeLayout, type IssueNode, type WorkerDef } from "@/components/workflow/types";

const WORKERS: WorkerDef[] = [
    { id: "w1", name: "worker 1", color: "#f87171" },
    { id: "w2", name: "worker 2", color: "#4ade80" },
    { id: "w3", name: "worker 3", color: "#c084fc" },
    { id: "w4", name: "worker 4", color: "#60a5fa" },
];

const INITIAL_NODES: IssueNode[] = [
    { id: "n1", workerId: "w1", sequence: 1, issueName: "Auth bug", description: "", issuer: "u1", engineer: "e1", estimatedMinutes: 40 },
    { id: "n2", workerId: "w1", sequence: 2, issueName: "Session refresh", description: "", issuer: "u1", engineer: "e1", estimatedMinutes: 25 },
    { id: "n3", workerId: "w1", sequence: 3, issueName: "Logout race", description: "", issuer: "u1", engineer: "e1", estimatedMinutes: 60 },
    { id: "n4", workerId: "w2", sequence: 1, issueName: "Migrate schema", description: "", issuer: "u1", engineer: "e2", estimatedMinutes: 20 },
    { id: "n5", workerId: "w2", sequence: 2, issueName: "Fix lint", description: "", issuer: "u1", engineer: "e2", estimatedMinutes: 15 },
    { id: "n6", workerId: "w2", sequence: 3, issueName: "Backfill rows", description: "", issuer: "u1", engineer: "e2", estimatedMinutes: 55 },
    { id: "n7", workerId: "w2", sequence: 4, issueName: "Add tests", description: "", issuer: "u1", engineer: "e2", estimatedMinutes: 25 },
    { id: "n8", workerId: "w3", sequence: 1, issueName: "Refactor API", description: "", issuer: "u1", engineer: "e3", estimatedMinutes: 45 },
    { id: "n9", workerId: "w3", sequence: 2, issueName: "Build pipeline", description: "", issuer: "u1", engineer: "e3", estimatedMinutes: 35 },
    { id: "n10", workerId: "w4", sequence: 1, issueName: "Cache layer", description: "", issuer: "u1", engineer: "e4", estimatedMinutes: 50 },
];

const LEAD = 5;
const TAIL = 30;

function getNowMinute(): number {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

export default function GanttPage() {
    const [nodes, setNodes] = useState<IssueNode[]>(INITIAL_NODES);
    const [startMinute, setStartMinute] = useState<number | null>(null);
    const [frozenNow] = useState(() => Math.floor(getNowMinute()));
    const [nowMinute, setNowMinute] = useState(getNowMinute);

    useEffect(() => {
        const id = setInterval(() => setNowMinute(getNowMinute()), 1000);
        return () => clearInterval(id);
    }, []);

    const effectiveStart = startMinute ?? frozenNow;
    const { positioned, endMinute } = computeLayout(nodes, effectiveStart, nowMinute);
    const originMinute = effectiveStart - LEAD;
    const spanEnd = Math.max(endMinute, nowMinute) + TAIL;

    const markers: TimelineMarker[] = positioned
        .filter((n) => n.status === "done")
        .map((n) => ({
            minute: n.endAbs,
            color: WORKERS.find((w) => w.id === n.workerId)?.color ?? "#ffffff",
        }));

    const handleStart = useCallback(() => {
        const now = Math.floor(getNowMinute());
        setStartMinute(now);
        setNodes((prev) => prev.map((n) => (n.sequence === 1 ? { ...n, startedAt: now } : n)));
    }, []);

    const handleEndNode = useCallback((workerId: string) => {
        const now = Math.floor(getNowMinute());
        setNodes((prev) => {
            const workerNodes = prev
                .filter((n) => n.workerId === workerId)
                .sort((a, b) => a.sequence - b.sequence);
            const running = workerNodes.find((n) => n.startedAt != null && n.endedAt == null);
            if (!running) return prev;
            const next = workerNodes.find((n) => n.sequence === running.sequence + 1);
            return prev.map((n) => {
                if (n.id === running.id) return { ...n, endedAt: now };
                if (next && n.id === next.id) return { ...n, startedAt: now + 2 };
                return n;
            });
        });
    }, []);

    return (
        <div
            className="relative w-full h-screen flex flex-col overflow-hidden"
            style={{ background: "#0a0a0a" }}
        >
            <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
                <h1 className="text-white font-semibold text-lg tracking-tight">Workflow</h1>
                <span
                    className="text-sm font-medium"
                    style={{ color: startMinute != null ? "#4ade80" : "rgba(255,255,255,0.3)" }}
                >
                    {startMinute != null ? "Running" : "Idle"}
                </span>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <Sidebar workers={WORKERS} />
                <div className="flex-1 overflow-y-auto min-w-0">
                    <Timeline originMinute={originMinute} endMinute={spanEnd} markers={markers}>
                        {WORKERS.map((worker) => (
                            <Layer
                                key={worker.id}
                                originMinute={originMinute}
                                nodes={positioned.filter((n) => n.workerId === worker.id)}
                                color={worker.color}
                            />
                        ))}
                    </Timeline>
                </div>
            </div>

            <SimPanel
                workers={WORKERS}
                positioned={positioned}
                isStarted={startMinute != null}
                onStart={handleStart}
                onEndNode={handleEndNode}
            />
        </div>
    );
}
