import { MatchaLogo } from "@/components/logo/MatchaLogo";

type StackCard = {
    id: string;
    label: string;
    side: "left" | "right";
    variant: "ghost" | "solid" | "hub";
};

const STACK_CARDS: StackCard[] = [
    { id: "board", label: "Shared board", side: "right", variant: "ghost" },
    { id: "agent", label: "Agent pickup", side: "left", variant: "ghost" },
    { id: "hub", label: "matcha runtime", side: "right", variant: "hub" },
    { id: "runners", label: "Sandbox runners", side: "left", variant: "solid" },
    { id: "pr", label: "Pull request", side: "right", variant: "solid" },
];

// Card geometry (in the flat plane, before the 3D tilt).
const CARD_W = 300;
const CARD_H = 200;
const CARD_T = 26; // extruded thickness (the connected 3D body depth)
const RADIUS = 16;
const GAP = 84; // vertical float gap between adjacent cards

// The whole deck's perspective tilt — a 3/4 view with clear, readable faces.
const ROT_X = 51;
const ROT_Z = -22;

// Primary purple and its shades — the only accent color in the deck.
const PRIMARY = "#ab9ff2";
const PRIMARY_LIGHT = "#c9c1f8";
const PRIMARY_DEEP = "#5f549e";

// The extruded body is built from many thin stacked slices of the rounded card, so the
// side walls follow the corner radius instead of poking out as square rectangular faces.
const SLICES = 60;

/** Parse "#rrggbb" → [r, g, b]. */
const toRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Linear blend between two hex colors, t in [0, 1]. */
function mixHex(a: string, b: string, t: number) {
    const ca = toRgb(a);
    const cb = toRgb(b);
    const c = ca.map((v, i) => Math.round(v + (cb[i]! - v) * t));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function CardSlab({ card }: { card: StackCard }) {
    if (card.variant === "ghost") {
        // Flat dashed outline — no thickness.
        return (
            <div
                className="absolute top-1/2 left-1/2"
                style={{
                    width: CARD_W,
                    height: CARD_H,
                    transform: "translate(-50%, -50%)",
                    borderRadius: RADIUS,
                    border: "1.5px dashed rgba(171,159,242,0.28)",
                    background: "rgba(171,159,242,0.02)",
                }}
            />
        );
    }

    const isHub = card.variant === "hub";

    // The side-wall color ramp: lit at the top (the seam with the face) → darker at the base.
    const wallTop = isHub ? PRIMARY_LIGHT : "#3d3d45";
    const wallBottom = isHub ? PRIMARY_DEEP : "#141416";
    // A lit top face so the slab reads against the ink background.
    const topFill = isHub
        ? "linear-gradient(150deg, #17151f 0%, #121019 55%, #0d0b14 100%)"
        : "linear-gradient(150deg, #1f1f24 0%, #141417 55%, #0f0f11 100%)";

    return (
        <div
            className="absolute top-1/2 left-1/2"
            style={{
                width: CARD_W,
                height: CARD_H,
                transform: "translate(-50%, -50%)",
                transformStyle: "preserve-3d",
            }}
        >
            {Array.from({ length: SLICES }).map((_, i) => {
                const f = i / (SLICES - 1);
                const z = CARD_T / 2 - f * CARD_T;
                const isFace = i === 0;

                return (
                    <div
                        key={i}
                        className="absolute inset-0"
                        style={{
                            borderRadius: RADIUS,
                            transform: `translateZ(${z}px)`,
                            background: isFace ? topFill : mixHex(wallTop, wallBottom, f),
                            border: isFace
                                ? isHub
                                    ? "1px solid rgba(171,159,242,0.35)"
                                    : "1px solid var(--color-edge)"
                                : undefined,
                            boxShadow: isFace
                                ? isHub
                                    ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 60px rgba(171,159,242,0.22)"
                                    : "inset 0 1px 0 rgba(255,255,255,0.05)"
                                : undefined,
                        }}
                    >
                        {isFace && isHub && (
                            <div className="flex h-full w-full items-center justify-center">
                                <MatchaLogo className="h-10 w-auto" style={{ color: PRIMARY }} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/** Distance from the card center (on screen) to where the connector line starts. */
const ANCHOR = 150;
const CONNECTOR_LENGTH = 90;

/**
 * A bubble label that faces the viewer while tracking its card in 3D — it counter-
 * rotates the deck's tilt so the pill stays flat and legible, then offsets sideways
 * in screen space.
 */
function BubbleLabel({ card }: { card: StackCard }) {
    const isRight = card.side === "right";
    const isHub = card.variant === "hub";

    return (
        <div
            className="pointer-events-none absolute top-1/2 left-1/2"
            style={{
                transformStyle: "preserve-3d",
                // Undo the deck rotation (reverse order, negated) so the label is screen-facing.
                transform: `translate(-50%, -50%) rotateZ(${-ROT_Z}deg) rotateX(${-ROT_X}deg)`,
            }}
        >
            <div
                className="absolute flex -translate-y-1/2 items-center"
                style={{
                    top: 0,
                    ...(isRight
                        ? { left: ANCHOR }
                        : { right: ANCHOR, flexDirection: "row-reverse" }),
                }}
            >
                {/* Node diamond at the line's inner end. */}
                <span
                    className="size-1.5 shrink-0 rotate-45"
                    style={{ backgroundColor: isHub ? PRIMARY : "rgba(255,255,255,0.35)" }}
                />
                {/* The line. */}
                <span
                    className="h-px shrink-0"
                    style={{
                        width: CONNECTOR_LENGTH,
                        background: isRight
                            ? "linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.08))"
                            : "linear-gradient(270deg, rgba(255,255,255,0.3), rgba(255,255,255,0.08))",
                    }}
                />
                {/* The bubble. */}
                <span
                    className="flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-medium whitespace-nowrap backdrop-blur-sm"
                    style={
                        isHub
                            ? {
                                  borderColor: "rgba(171,159,242,0.45)",
                                  backgroundColor: "rgba(171,159,242,0.14)",
                                  color: "#d8d1f7",
                              }
                            : {
                                  borderColor: "rgba(255,255,255,0.1)",
                                  backgroundColor: "rgba(255,255,255,0.04)",
                                  color: "#d4d4d4",
                              }
                    }
                >
                    <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: isHub ? PRIMARY : "rgba(255,255,255,0.5)" }}
                    />
                    {card.label}
                </span>
            </div>
        </div>
    );
}

export default function WhyHero() {
    const lastIndex = STACK_CARDS.length - 1;

    return (
        <section
            className="flex h-screen w-full items-center justify-center overflow-hidden"
            style={{ perspective: "2200px", perspectiveOrigin: "50% 50%" }}
        >
            <div
                className="relative"
                style={{
                    width: CARD_W,
                    height: CARD_H,
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${ROT_X}deg) rotateZ(${ROT_Z}deg)`,
                }}
            >
                {STACK_CARDS.map((card, index) => {
                    // Center the deck around Z=0: index 0 (top ghost) floats highest,
                    // the middle hub card sits at the center, the last card lowest. Each
                    // card sits at its final depth from the first paint — no entrance
                    // animation, because animating opacity/translateZ on a preserve-3d
                    // node flattens its extruded slices mid-tween and snaps them back.
                    const z = (lastIndex / 2 - index) * GAP;

                    return (
                        <div
                            key={card.id}
                            className="absolute inset-0"
                            style={{
                                transformStyle: "preserve-3d",
                                transform: `translateZ(${z}px)`,
                            }}
                        >
                            <CardSlab card={card} />
                            <BubbleLabel card={card} />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
