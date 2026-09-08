import type { CSSProperties } from "react";

const INK = "#1F2419";
const GREEN = "#34D59A";
const LAVENDER = "var(--color-primary)";

export const PLATE_BONE = "#EDE7DA";
export const PLATE_DARWIN = "#DCE4CE";

const INK_WIDTH = 7.5;
const INK_WIDTH_HEAVY = 9;
const INK_WIDTH_LIGHT = 6.5;
const INK_WIDTH_HAIRLINE = 4.5;
const PLATE_WIDTH = 4.5;

const VIEW_BOX = "0 0 240 144";
const OFF_REGISTER = "translate(-5,4)";
const MULTIPLY: CSSProperties = { mixBlendMode: "multiply" };

const CARD_BACK =
    "M60 36 C87 32, 114 28, 142 24 C146 48, 151 72, 156 96 C129 100, 101 104, 74 108 C69 84, 64 60, 60 36 Z";
const CARD_FRONT =
    "M44 50 C71 46, 98 42, 126 38 C130 62, 135 86, 140 110 C113 114, 85 118, 58 122 C53 98, 48 74, 44 50 Z";
const CARD_RULE_UPPER = "M62 74 C78 71, 94 69, 110 67";
const CARD_RULE_LOWER = "M66 92 C78 90, 90 88, 102 86";

const CLAIM_COIL =
    "M22 104 C20 82, 24 58, 36 56 C48 54, 50 78, 50 102 C50 122, 64 122, 66 100 C68 78, 66 58, 78 56 C90 54, 92 78, 92 98 C94 114, 106 112, 112 96 C118 78, 130 44, 152 48 C174 52, 180 84, 158 96 C143 104, 128 96, 131 82";
const CLAIM_EDGE_UP = "M150 74 C166 63, 182 52, 196 42";
const CLAIM_EDGE_DOWN = "M150 74 C162 87, 175 100, 188 112";
const CLAIM_EDGE_BACK = "M150 74 C136 87, 122 100, 108 112";

const TIER_MASS =
    "M58 124 C57 117, 57 110, 58 104 C62 103, 66 103, 70 104 C69 98, 69 92, 70 86 C75 85, 80 85, 85 86 C84 79, 84 73, 85 66 C90 65, 95 65, 100 66 C99 60, 99 54, 100 48 C115 47, 130 47, 145 48 C144 54, 144 60, 145 66 C150 65, 154 65, 159 66 C158 73, 158 79, 159 86 C164 85, 168 85, 173 86 C172 92, 172 98, 173 104 C177 103, 182 103, 186 104 C187 110, 187 117, 186 124 Z";
const TIER_ARCH =
    "M36 58 C36 47, 36 36, 37 26 C93 24, 149 23, 205 25 C204 38, 204 51, 203 64 C193 64.5, 183 64.5, 173 64 C172 59, 172 53, 173 48 C165 48.5, 158 48.5, 151 48 C150 44, 150 40, 151 36 C137 35, 123 35, 110 36 C109 40, 109 44, 110 48 C103 48.5, 96 48.5, 89 48 C88 53, 88 59, 89 64 C72 64.5, 55 64.5, 39 64 C38 62, 37.5 60, 37 55";

const SCROLL_SHEET =
    "M62 46 C61 74, 60 102, 62 124 C102 126, 142 126, 182 124 C184 100, 185 72, 183 44 C143 42, 102 42, 62 46";
const SCROLL_TOP_CURL = "M62 46 C52 32, 62 20, 76 24 C87 27, 87 40, 76 43";
const SCROLL_BOTTOM_CURL = "M62 124 C53 136, 64 142, 78 139";
const SCROLL_FOLD = "M63 108 C103 110, 143 110, 183 108";
const BRANCH_STEM = "M122 104 C121 88, 122 72, 122 56";
const BRANCH_LOWER = "M122 90 C112 85, 103 78, 96 70";
const BRANCH_MIDDLE = "M122 78 C133 73, 143 66, 150 58";
const BRANCH_UPPER = "M122 66 C114 62, 107 57, 101 51";

function Plate({ children }: { children: React.ReactNode }) {
    return (
        <svg
            aria-hidden
            viewBox={VIEW_BOX}
            className="h-auto w-full"
            shapeRendering="geometricPrecision"
        >
            {children}
        </svg>
    );
}

function Ink({ d, width = INK_WIDTH }: { d: string; width?: number }) {
    return (
        <path
            d={d}
            fill="none"
            stroke={INK}
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );
}

function PlateLine({ d, color }: { d: string; color: string }) {
    return (
        <path d={d} fill="none" stroke={color} strokeWidth={PLATE_WIDTH} strokeLinecap="round" />
    );
}

export function FileIssueArt() {
    return (
        <Plate>
            <Ink d={CARD_BACK} width={6} />
            <g transform={OFF_REGISTER} style={MULTIPLY}>
                <path d={CARD_FRONT} fill={GREEN} />
            </g>
            <Ink d={CARD_FRONT} />
            <Ink d={CARD_RULE_UPPER} width={INK_WIDTH_HAIRLINE} />
            <Ink d={CARD_RULE_LOWER} width={INK_WIDTH_HAIRLINE} />
            <circle cx={196} cy={60} r={9} fill="none" stroke={INK} strokeWidth={5.5} />
            <circle cx={184} cy={104} r={6} fill="none" stroke={INK} strokeWidth={5} />
        </Plate>
    );
}

export function AgentClaimsArt() {
    return (
        <Plate>
            <g transform={OFF_REGISTER} style={MULTIPLY}>
                <PlateLine d={CLAIM_EDGE_UP} color={LAVENDER} />
                <PlateLine d={CLAIM_EDGE_DOWN} color={LAVENDER} />
                <PlateLine d={CLAIM_EDGE_BACK} color={LAVENDER} />
                <circle cx={150} cy={74} r={12} fill={LAVENDER} />
                <circle cx={196} cy={42} r={8.5} fill={LAVENDER} />
                <circle cx={188} cy={112} r={8} fill={LAVENDER} />
                <circle cx={108} cy={112} r={7} fill={LAVENDER} />
            </g>
            <Ink d={CLAIM_COIL} />
        </Plate>
    );
}

export function VerifiedArt() {
    return (
        <Plate>
            <g transform={OFF_REGISTER} style={MULTIPLY}>
                <path d={TIER_MASS} fill={GREEN} />
            </g>
            <Ink d={TIER_ARCH} width={INK_WIDTH_HEAVY} />
        </Plate>
    );
}

export function ReviewPrArt() {
    return (
        <Plate>
            <g transform={OFF_REGISTER} style={MULTIPLY}>
                <PlateLine d={BRANCH_STEM} color={LAVENDER} />
                <PlateLine d={BRANCH_LOWER} color={LAVENDER} />
                <PlateLine d={BRANCH_MIDDLE} color={LAVENDER} />
                <PlateLine d={BRANCH_UPPER} color={LAVENDER} />
                <circle cx={122} cy={54} r={6} fill={LAVENDER} />
                <circle cx={94} cy={68} r={6} fill={LAVENDER} />
                <circle cx={152} cy={56} r={6} fill={LAVENDER} />
                <circle cx={99} cy={49} r={6} fill={LAVENDER} />
                <circle cx={122} cy={106} r={6.5} fill={LAVENDER} />
            </g>
            <Ink d={SCROLL_SHEET} />
            <Ink d={SCROLL_TOP_CURL} width={INK_WIDTH_LIGHT} />
            <Ink d={SCROLL_BOTTOM_CURL} width={INK_WIDTH_LIGHT} />
            <Ink d={SCROLL_FOLD} width={6} />
        </Plate>
    );
}
