import { GanttTimeline } from "@/lib/gantt/GanttTimeline";
import { cn } from "@/lib/utils";

/**
 * Full-height vertical gridlines behind the lanes: a stronger line every hour and
 * a faint one every 15 minutes, so a bar's start/end can be read against the
 * grid. Sits beneath the lane content and the now-line.
 */
export default function GanttGrid() {
    const lines = Array.from({ length: GanttTimeline.DAY_MINUTES / 15 + 1 }, (_, i) => i * 15);

    return (
        <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{ width: GanttTimeline.DAY_WIDTH }}
        >
            {lines.map((m) => (
                <div
                    key={m}
                    className={cn(
                        "absolute inset-y-0 w-px",
                        m % 60 === 0 ? "bg-border" : "bg-border/30",
                    )}
                    style={{ left: m * GanttTimeline.MINUTE_WIDTH }}
                />
            ))}
        </div>
    );
}
