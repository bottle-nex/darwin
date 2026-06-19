import { MdPause } from "react-icons/md";
import { RULER_HEIGHT, SIDEBAR_WIDTH, WORKER_LANES } from "./types";

/**
 * Fixed left column of worker lane labels. Stays put while the timeline track
 * scrolls horizontally. The top spacer matches the ruler height; the lanes flex
 * to fill the remaining height equally, matching the lane rows in the track.
 * A worker with a frozen issue shows a "Paused" badge under its name.
 */
export default function GanttSidebar({ pausedWorkerIds }: { pausedWorkerIds: Set<string> }) {
    return (
        <div
            className="flex h-full shrink-0 flex-col border-r border-border bg-card"
            style={{ width: SIDEBAR_WIDTH }}
        >
            <div style={{ height: RULER_HEIGHT }} className="shrink-0 border-b border-border" />
            {WORKER_LANES.map((lane) => (
                <div
                    key={lane.id}
                    className="flex flex-1 flex-col justify-center gap-1.5 border-b border-border px-4 last:border-b-0"
                >
                    <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: lane.color }} />
                        <span className="text-sm font-medium text-foreground">{lane.name}</span>
                    </div>
                    {pausedWorkerIds.has(lane.id) && (
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                            <MdPause className="size-2.5" aria-hidden />
                            Paused
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
