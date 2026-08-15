const HALF_W = 168;
const HALF_H = 97;
const DEPTH = 18;

const TOWER_COUNT = 13;
const TOWER_PITCH = 24;

const CASCADE_COUNT = 7;

const fmt = (value: number) => Number(value.toFixed(2));

const TOP_FACE = `M 0 ${-HALF_H} L ${HALF_W} 0 L 0 ${HALF_H} L ${-HALF_W} 0 Z`;
const BODY = `M ${-HALF_W} 0 L ${-HALF_W} ${DEPTH} L 0 ${HALF_H + DEPTH} L ${HALF_W} ${DEPTH} L ${HALF_W} 0`;
const FRONT_EDGE = `M 0 ${HALF_H} L 0 ${HALF_H + DEPTH}`;

function Slab() {
    return (
        <g fill="var(--color-ink)">
            <path d={BODY} />
            <path d={TOP_FACE} />
            <path d={FRONT_EDGE} fill="none" />
        </g>
    );
}

const TOWER = Array.from({ length: TOWER_COUNT }, (_, i) => i * TOWER_PITCH).reverse();

const CASCADE = Array.from({ length: CASCADE_COUNT }, (_, i) => {
    const t = (i + 1) / CASCADE_COUNT;
    return {
        x: fmt(-t * 470),
        y: fmt(-t * 560 - Math.sin(t * Math.PI) * 50),
        rotate: fmt(-t * 24),
    };
}).reverse();

export function ChangelogBackdrop() {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute top-0 right-0 hidden w-[820px] translate-x-[24%] -translate-y-[6%] text-mist opacity-[0.11] select-none md:block lg:w-[1000px]"
            style={{
                maskImage: "linear-gradient(to bottom, black 0%, black 42%, transparent 82%)",
            }}
        >
            <svg
                viewBox="-660 -730 840 1190"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinejoin="round"
                className="h-auto w-full"
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
