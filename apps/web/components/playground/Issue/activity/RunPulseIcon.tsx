"use client";
import "./RunPulseIcon.css";

const CELLS = [6, 17, 28, 39, 50];

const COLUMN_STEP_MS = 240;
const ROW_STEP_MS = 96;

function delayFor(row: number, column: number) {
    return (CELLS.length - 1 - row) * COLUMN_STEP_MS + column * ROW_STEP_MS;
}

export default function RunPulseIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden>
            {CELLS.map((y, row) =>
                CELLS.map((x, column) => (
                    <circle
                        key={`base-${row}-${column}`}
                        className="run-pulse-base"
                        cx={x}
                        cy={y}
                        r={2.4}
                    />
                )),
            )}
            {CELLS.map((y, row) =>
                CELLS.map((x, column) => (
                    <circle
                        key={`lit-${row}-${column}`}
                        className="run-pulse-lit"
                        cx={x}
                        cy={y}
                        r={3.1}
                        style={{ animationDelay: `${delayFor(row, column)}ms` }}
                    />
                )),
            )}
        </svg>
    );
}
