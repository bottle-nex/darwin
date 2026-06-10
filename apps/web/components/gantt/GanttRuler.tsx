import { cn } from "@/lib/utils";
import { DAY_MINUTES, DAY_WIDTH, MINUTE_WIDTH, RULER_HEIGHT } from "./types";

/**
 * The top time axis. Ticks every 5 minutes (matching the 5-minute grid blocks),
 * with three weights — hour (tall + "HH:00" label), quarter-hour (medium), and
 * five-minute (short). Only the hour is labelled. Rendered inside the
 * horizontally-scrolling track so it stays aligned with the gridlines and lanes.
 */
export default function GanttRuler() {
    const ticks = Array.from({ length: DAY_MINUTES / 5 + 1 }, (_, i) => i * 5);

    return (
        <div
            className="relative shrink-0 border-b border-border"
            style={{ width: DAY_WIDTH, height: RULER_HEIGHT }}
        >
            {ticks.map((m) => {
                const isHour = m % 60 === 0;
                const isQuarter = m % 15 === 0;
                const height = isHour ? 14 : isQuarter ? 9 : 5;
                return (
                    <div key={m} className="absolute bottom-0" style={{ left: m * MINUTE_WIDTH }}>
                        <div
                            className={cn("w-px", isHour ? "bg-border" : "bg-border/50")}
                            style={{ height }}
                        />
                        {isHour && m < DAY_MINUTES && (
                            <span className="absolute -top-4 left-0.5 font-mono text-[11px] text-muted-foreground">
                                {String(m / 60).padStart(2, "0")}:00
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
