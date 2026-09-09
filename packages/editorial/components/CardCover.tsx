import { HALF_H, Slab, slabTower } from "./SlabMotif";
import { cn } from "../lib/cn";

const TOWER = slabTower(6, 30);

const COVER_HEIGHT = HALF_H * 2;

const SIZES = {
    card: { frame: "rounded-[8px]", version: "text-4xl sm:text-5xl", stroke: 2.2 },
    feature: { frame: "rounded-xl", version: "text-5xl md:text-7xl", stroke: 1.8 },
} as const;

function monogram(title: string) {
    const words = title.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "M";
    if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
    return `${words[0]![0]}${words[1]![0]}`.toUpperCase();
}

type CardCoverProps = {
    src: string | null;
    title: string;
    version: string | null;
    size?: keyof typeof SIZES;
};

export function CardCover({ src, title, version, size = "card" }: CardCoverProps) {
    const style = SIZES[size];

    if (src) {
        return (
            <div
                className={cn("aspect-[16/9] overflow-hidden border border-graphite", style.frame)}
            >
                <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500"
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative isolate flex aspect-[16/9] items-center justify-center overflow-hidden border border-graphite bg-linear-to-b from-cement to-ink",
                style.frame,
            )}
        >
            <svg
                aria-hidden
                viewBox={`-200 -${HALF_H + 20} 400 ${COVER_HEIGHT + 120}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={style.stroke}
                strokeLinejoin="round"
                className="absolute -right-6 -bottom-10 h-[150%] w-auto text-mist opacity-[0.13]"
            >
                {TOWER.map((offset) => (
                    <g key={offset} transform={`translate(0 ${offset})`}>
                        <Slab />
                    </g>
                ))}
            </svg>

            <span
                className={cn(
                    "relative z-10 font-headline tracking-tight text-overlay/85",
                    style.version,
                )}
            >
                {version ?? monogram(title)}
            </span>
        </div>
    );
}
