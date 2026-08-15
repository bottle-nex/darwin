import type { ReleaseChannel } from "../types";
import { cn } from "../lib/cn";

const CHANNEL_CLASS: Record<ReleaseChannel, string> = {
    Stable: "border-graphite bg-graphite text-mist/70",
    Beta: "border-primary/25 bg-primary/10 text-primary",
};

export function StatusTag({ channel }: { channel: ReleaseChannel }) {
    return (
        <span
            className={cn(
                "inline-flex rounded-full border px-2 py-0.5 font-mono text-[11px] tracking-widest uppercase",
                CHANNEL_CLASS[channel],
            )}
        >
            {channel}
        </span>
    );
}
