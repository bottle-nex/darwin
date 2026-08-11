/**
 * The loose grid of squares on a collapsed feature card.
 *
 * Positions are generated from a seed rather than Math.random(), so the server
 * and the client scatter them identically. Everything is measured in px inside a
 * fixed box, which is what lets the overlap test below be exact — percentages
 * would have to be compared against two different reference lengths.
 */

const SQUARE_COUNT = 9;

/** Tints of the brand lavender, lightest to darkest. */
const SQUARE_COLORS = ["#8B79E8", "#AB9FF2", "#C9C0F7", "#E4DFFB"];

const FIELD_WIDTH = 224;
const FIELD_HEIGHT = 200;

const SQUARE_MIN_SIZE = 18;
const SQUARE_MAX_SIZE = 26;

/** Clear space kept between squares, so none of them touch. */
const SQUARE_GAP = 8;

/** Bounded so a crowded seed can never spin here. */
const MAX_PLACEMENT_ATTEMPTS = 400;

type ScatterSquare = {
    left: number;
    top: number;
    size: number;
    color: string;
};

/** mulberry32 — small, fast, and stable across server and client. */
function createRandom(seed: number) {
    let state = seed;

    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** True when the two squares would touch, once each is padded by SQUARE_GAP. */
function overlaps(a: ScatterSquare, b: ScatterSquare) {
    return (
        a.left < b.left + b.size + SQUARE_GAP &&
        b.left < a.left + a.size + SQUARE_GAP &&
        a.top < b.top + b.size + SQUARE_GAP &&
        b.top < a.top + a.size + SQUARE_GAP
    );
}

/**
 * Rejection sampling: draw a position, keep it only if it clears every square
 * already placed. Simpler than packing, and at this density it lands all nine
 * well inside the attempt budget.
 */
function buildScatter(seed: number): ScatterSquare[] {
    const random = createRandom(seed);
    const squares: ScatterSquare[] = [];

    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
        if (squares.length === SQUARE_COUNT) break;

        const size = SQUARE_MIN_SIZE + Math.round(random() * (SQUARE_MAX_SIZE - SQUARE_MIN_SIZE));
        const candidate: ScatterSquare = {
            left: random() * (FIELD_WIDTH - size),
            top: random() * (FIELD_HEIGHT - size),
            size,
            color: SQUARE_COLORS[Math.floor(random() * SQUARE_COLORS.length)] ?? "#AB9FF2",
        };

        if (!squares.some((placed) => overlaps(placed, candidate))) {
            squares.push(candidate);
        }
    }

    return squares;
}

export default function ScatterField({ seed }: { seed: number }) {
    return (
        <div
            className="relative my-auto"
            style={{ width: `${FIELD_WIDTH}px`, height: `${FIELD_HEIGHT}px` }}
        >
            {buildScatter(seed).map((square, index) => (
                <span
                    key={index}
                    className="absolute rounded-[3px]"
                    style={{
                        left: `${square.left}px`,
                        top: `${square.top}px`,
                        width: `${square.size}px`,
                        height: `${square.size}px`,
                        backgroundColor: square.color,
                    }}
                />
            ))}
        </div>
    );
}
