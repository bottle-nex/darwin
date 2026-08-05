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
                raisedIndex === undefined ? "h-85" : "h-100",
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
                        className="absolute bottom-0"
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
        </div>
    );
}
