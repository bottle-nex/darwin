export const HALF_W = 168;
export const HALF_H = 97;
export const DEPTH = 18;

export const round = (value: number) => Number(value.toFixed(2));

const TOP_FACE = `M 0 ${-HALF_H} L ${HALF_W} 0 L 0 ${HALF_H} L ${-HALF_W} 0 Z`;
const BODY = `M ${-HALF_W} 0 L ${-HALF_W} ${DEPTH} L 0 ${HALF_H + DEPTH} L ${HALF_W} ${DEPTH} L ${HALF_W} 0`;
const FRONT_EDGE = `M 0 ${HALF_H} L 0 ${HALF_H + DEPTH}`;

export function Slab() {
    return (
        <g fill="var(--color-ink)">
            <path d={BODY} />
            <path d={TOP_FACE} />
            <path d={FRONT_EDGE} fill="none" />
        </g>
    );
}

export function slabTower(count: number, pitch: number) {
    return Array.from({ length: count }, (_, i) => i * pitch).reverse();
}
