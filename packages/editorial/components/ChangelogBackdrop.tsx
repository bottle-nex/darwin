import { Slab, round, slabTower } from "./SlabMotif";

const TOWER_COUNT = 13;
const TOWER_PITCH = 24;
const CASCADE_COUNT = 7;

const TOWER = slabTower(TOWER_COUNT, TOWER_PITCH);

const CASCADE = Array.from({ length: CASCADE_COUNT }, (_, i) => {
    const t = (i + 1) / CASCADE_COUNT;
    return {
        x: round(-t * 470),
        y: round(-t * 560 - Math.sin(t * Math.PI) * 50),
        rotate: round(-t * 24),
    };
}).reverse();

export function ChangelogBackdrop() {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden overflow-hidden select-none md:block"
            style={{
                maskImage:
                    "linear-gradient(to bottom, transparent 0%, black 18%, black 74%, transparent 100%)",
            }}
        >
            <svg
                viewBox="-660 -690 850 1120"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinejoin="round"
                preserveAspectRatio="xMaxYMin meet"
                className="absolute top-0 -right-[8%] h-[135%] w-auto text-mist opacity-[0.11]"
            >
                {CASCADE.map((slab) => (
                    <g
                        key={`cascade-${slab.x}-${slab.y}`}
                        transform={`translate(${slab.x} ${slab.y}) rotate(${slab.rotate})`}
                    >
                        <Slab />
                    </g>
                ))}

                {TOWER.map((offset) => (
                    <g key={`tower-${offset}`} transform={`translate(0 ${offset})`}>
                        <Slab />
                    </g>
                ))}
            </svg>
        </div>
    );
}
