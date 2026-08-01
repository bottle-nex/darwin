import { cn } from "@/lib/utils";
import { FolderShape } from "./FolderShape";

export type BoxFolder = {
    label: string;
    tint: "cement" | "lavender" | "snow";
    decay: 0 | 1 | 2 | 3;
};

const LABEL_DECAY = [
    "text-neutral-300",
    "text-neutral-400",
    "text-neutral-500",
    "text-neutral-600 line-through decoration-neutral-600",
];

const TINTS: Record<BoxFolder["tint"], { stroke: string; fill: string; label?: string }> = {
    cement: { stroke: "stroke-white/10", fill: "fill-cement" },
    lavender: { stroke: "stroke-[#8B77EC]", fill: "fill-primary", label: "text-neutral-900" },
    snow: { stroke: "stroke-white/20", fill: "fill-snow", label: "text-ink/60" },
};

export function FolderBox({
    folders,
    raisedIndex,
    showBase = true,
    className,
}: {
    folders: BoxFolder[];
    raisedIndex?: number;
    showBase?: boolean;
    className?: string;
}) {
    return (
        <div
            aria-hidden
            className={cn(
                "pointer-events-none relative w-full select-none",
                raisedIndex === undefined ? "h-[340px]" : "h-[400px]",
                className,
            )}
        >
            {folders.map((folder, i) => {
                const raised = i === raisedIndex;
                const tint = TINTS[folder.tint];
                return (
                    <div
                        key={folder.label}
                        style={{
                            left: `${4 + i * 12}%`,
                            width: "44%",
                            height: (raised ? 260 : 130 + i * 18) + 26,
                            zIndex: 30 - i,
                        }}
                        className="absolute bottom-22.5"
                    >
                        <FolderShape
                            tabLabel={folder.label}
                            className="h-full w-full"
                            strokeClassName={tint.stroke}
                            fillClassName={tint.fill}
                            labelClassName={tint.label ?? LABEL_DECAY[folder.decay]}
                        />
                    </div>
                );
            })}
            {showBase ? (
                <div className="absolute inset-x-0 bottom-0 z-40 h-[150px] rounded-t-sm border border-white/15 border-b-0 bg-charcoal">
                    <div className="absolute left-1/2 top-1/2 h-8 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-ink/40" />
                </div>
            ) : (
                <div className="absolute inset-x-0 bottom-0 z-40 h-55 bg-linear-to-t from-ink from-25% via-ink/80 to-transparent backdrop-blur-md mask-[linear-gradient(to_top,black_50%,transparent)]" />
            )}
        </div>
    );
}
