import { cn } from "@/lib/utils";
import { azeretMono } from "@/components/ui/button";
import { FolderShape } from "./FolderShape";

export type LifecycleStage = {
    index: string;
    tab: string;
    title: string;
    description: string;
    surface: "cement" | "snow" | "primary";
    accent?: boolean;
};

const SURFACES = {
    cement: {
        fill: "fill-cement",
        stroke: "stroke-white/15",
        tabLabel: "text-mist/60",
        title: "text-mist",
        description: "text-mist/60",
    },
    snow: {
        fill: "fill-snow",
        stroke: "stroke-white/20",
        tabLabel: "text-ink/60",
        title: "text-ink",
        description: "text-ink/60",
    },
    primary: {
        fill: "fill-primary",
        stroke: "stroke-[#8B77EC]",
        tabLabel: "text-ink",
        title: "text-ink",
        description: "text-graphite",
    },
} as const;

export function LifecycleCard({ stage }: { stage: LifecycleStage }) {
    const surface = SURFACES[stage.surface];
    return (
        <FolderShape
            closedBottom
            tabLabel={`${stage.index} / ${stage.tab}`}
            tabWidth={140}
            className="h-full"
            strokeClassName={surface.stroke}
            fillClassName={surface.fill}
            labelClassName={surface.tabLabel}
        >
            <div className="flex min-h-[300px] flex-col justify-end gap-4 p-5 pt-12">
                <h3 className={cn("text-lg", surface.title)}>{stage.title}</h3>
                <p className={cn("text-sm font-light leading-relaxed", surface.description)}>
                    {stage.description}
                </p>
                {stage.accent && (
                    <span
                        className={cn(
                            "w-fit rounded-full bg-primary/15 px-3 py-1 text-[10px] tracking-widest text-[#6C55DE]",
                            azeretMono.className,
                        )}
                    >
                        PR #214 OPEN
                    </span>
                )}
            </div>
        </FolderShape>
    );
}
