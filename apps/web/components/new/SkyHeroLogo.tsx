import { APP_LOGO_PATH, APP_LOGO_SIZE } from "@/components/logo/AppLogo";

const BOUNDARY_GAP = 18;
const BOUNDARY_LINE = 2;
const BEVEL_WIDTH = 3;
const PADDING = 48;

const FRAME = {
    x: -PADDING,
    y: -PADDING,
    width: APP_LOGO_SIZE.width + PADDING * 2,
    height: APP_LOGO_SIZE.height + PADDING * 2,
};

export default function SkyHeroLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox={`${FRAME.x} ${FRAME.y} ${FRAME.width} ${FRAME.height}`}
            className={className}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="sky-hero-glass" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="0.45" stopColor="#f3f1ff" stopOpacity="0.96" />
                    <stop offset="1" stopColor="#cdc4f6" stopOpacity="0.82" />
                </linearGradient>
                <radialGradient id="sky-hero-gloss" cx="0.22" cy="0.08" r="0.75">
                    <stop offset="0" stopColor="#ffffff" stopOpacity="0.75" />
                    <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.12" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="sky-hero-bevel" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.4" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="sky-hero-boundary" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.45" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity="0.15" />
                </linearGradient>
                <clipPath id="sky-hero-body">
                    <path d={APP_LOGO_PATH} />
                </clipPath>
                <mask id="sky-hero-boundary-cut" maskUnits="userSpaceOnUse" {...FRAME}>
                    <rect {...FRAME} fill="white" />
                    <path
                        d={APP_LOGO_PATH}
                        fill="black"
                        stroke="black"
                        strokeWidth={BOUNDARY_GAP * 2}
                        strokeLinejoin="round"
                    />
                </mask>
            </defs>

            <path
                d={APP_LOGO_PATH}
                fill="none"
                stroke="url(#sky-hero-boundary)"
                strokeWidth={(BOUNDARY_GAP + BOUNDARY_LINE) * 2}
                strokeLinejoin="round"
                mask="url(#sky-hero-boundary-cut)"
            />

            <g className="drop-shadow-[0_28px_44px_rgba(30,16,90,0.42)]">
                <path d={APP_LOGO_PATH} fill="url(#sky-hero-glass)" />
                <path d={APP_LOGO_PATH} fill="url(#sky-hero-gloss)" />
                <path
                    d={APP_LOGO_PATH}
                    fill="none"
                    stroke="url(#sky-hero-bevel)"
                    strokeWidth={BEVEL_WIDTH * 2}
                    clipPath="url(#sky-hero-body)"
                />
            </g>
        </svg>
    );
}
