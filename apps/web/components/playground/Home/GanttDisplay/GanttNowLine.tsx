import { MINUTE_WIDTH } from "./types";

/** Fractional minute-of-day → "HH:MM:SS". */
function fmtClockSeconds(minute: number): string {
    const total = Math.max(0, Math.floor(minute * 60));
    const h = String(Math.floor(total / 3600) % 24).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
}

/**
 * The live "now" marker — a vertical line at the current minute-of-day, spanning
 * the ruler and all lanes. Only rendered when the viewed date is today. Hovering
 * the line (a wider invisible hit strip) reveals the live time.
 */
export default function GanttNowLine({ minute }: { minute: number }) {
    return (
        <div
            className="group pointer-events-none absolute inset-y-0 z-10"
            style={{ left: minute * MINUTE_WIDTH }}
        >
            {/* wider transparent hover target around the 1px line */}
            <div className="pointer-events-auto absolute inset-y-0 -left-1.5 w-3" />
            <div className="absolute inset-y-0 left-0 w-px bg-[#AB9FF2]" />
            <div className="absolute -left-1 -top-1 size-2 rounded-full bg-[#AB9FF2]" />
            <span className="pointer-events-none absolute left-1.5 top-0.5 rounded bg-[#AB9FF2] px-1.5 py-0.5 font-mono text-[10px] font-medium text-neutral-900 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                {fmtClockSeconds(minute)}
            </span>
        </div>
    );
}
