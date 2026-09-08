const STEM = "M258 292a84 84 0 0 1 168 0v830h-168z";
const BOWL = "M240 336h100c460 0 460 470 0 470h-140";
const BOWL_WIDTH = 166;

export function GlassDIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="96 96 832 832"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={className}
        >
            <defs>
                <clipPath id="glass-d-tile">
                    <rect x="96" y="96" width="832" height="832" rx="190" />
                </clipPath>
                <clipPath id="glass-d-stem-clip">
                    <path d={STEM} />
                </clipPath>
                <mask id="glass-d-bowl-mask">
                    <path
                        d={BOWL}
                        fill="none"
                        stroke="#fff"
                        strokeWidth={BOWL_WIDTH + 2}
                        strokeLinecap="round"
                    />
                </mask>
                <linearGradient id="glass-d-bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#e3e2f6" />
                    <stop offset="0.5" stopColor="#f8edf1" />
                    <stop offset="1" stopColor="#f8dde2" />
                </linearGradient>
                <linearGradient
                    id="glass-d-red"
                    gradientUnits="userSpaceOnUse"
                    x1="260"
                    y1="200"
                    x2="440"
                    y2="950"
                >
                    <stop offset="0" stopColor="#ff8a98" />
                    <stop offset="0.3" stopColor="#ff6375" />
                    <stop offset="1" stopColor="#f3435a" />
                </linearGradient>
                <linearGradient
                    id="glass-d-red-sheen"
                    gradientUnits="userSpaceOnUse"
                    x1="258"
                    y1="0"
                    x2="426"
                    y2="0"
                >
                    <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
                    <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
                    <stop offset="1" stopColor="#7a0020" stopOpacity="0.12" />
                </linearGradient>
                <linearGradient
                    id="glass-d-blue"
                    gradientUnits="userSpaceOnUse"
                    x1="180"
                    y1="300"
                    x2="780"
                    y2="860"
                >
                    <stop offset="0" stopColor="#43a3fa" />
                    <stop offset="0.35" stopColor="#1d6ef2" />
                    <stop offset="0.8" stopColor="#1a3ae0" />
                    <stop offset="1" stopColor="#1c2bd0" />
                </linearGradient>
                <linearGradient
                    id="glass-d-violet"
                    gradientUnits="userSpaceOnUse"
                    x1="0"
                    y1="250"
                    x2="0"
                    y2="900"
                >
                    <stop offset="0" stopColor="#4a22d6" />
                    <stop offset="0.5" stopColor="#3714b4" />
                    <stop offset="1" stopColor="#280a88" />
                </linearGradient>
                <filter id="glass-d-glow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="64" />
                </filter>
                <filter id="glass-d-shadow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="14" />
                </filter>
                <filter id="glass-d-soft" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="22" />
                </filter>
            </defs>
            <g clipPath="url(#glass-d-tile)">
                <rect x="96" y="96" width="832" height="832" fill="url(#glass-d-bg)" />
                <ellipse
                    cx="470"
                    cy="800"
                    rx="330"
                    ry="220"
                    fill="#ff5c6e"
                    opacity="0.34"
                    filter="url(#glass-d-glow)"
                />
                <ellipse
                    cx="820"
                    cy="380"
                    rx="200"
                    ry="260"
                    fill="#ff7d8c"
                    opacity="0.22"
                    filter="url(#glass-d-glow)"
                />
                <ellipse
                    cx="200"
                    cy="330"
                    rx="160"
                    ry="120"
                    fill="#2d7cf3"
                    opacity="0.22"
                    filter="url(#glass-d-glow)"
                />
                <ellipse
                    cx="560"
                    cy="560"
                    rx="120"
                    ry="150"
                    fill="#2d7cf3"
                    opacity="0.18"
                    filter="url(#glass-d-glow)"
                />
                <path
                    d={STEM}
                    fill="#7a1030"
                    opacity="0.22"
                    filter="url(#glass-d-shadow)"
                    transform="translate(8 16)"
                />
                <path
                    d={STEM}
                    fill="url(#glass-d-red)"
                    stroke="#ffb0ba"
                    strokeWidth="4"
                    paintOrder="stroke"
                />
                <path d={STEM} fill="url(#glass-d-red-sheen)" />
                <path
                    d={BOWL}
                    fill="none"
                    stroke="#0b1670"
                    strokeWidth={BOWL_WIDTH + 2}
                    strokeLinecap="round"
                    opacity="0.24"
                    filter="url(#glass-d-shadow)"
                    transform="translate(8 18)"
                />
                <path
                    d={BOWL}
                    fill="none"
                    stroke="#86c2ff"
                    strokeWidth={BOWL_WIDTH + 6}
                    strokeLinecap="round"
                />
                <path
                    d={BOWL}
                    fill="none"
                    stroke="url(#glass-d-blue)"
                    strokeWidth={BOWL_WIDTH}
                    strokeLinecap="round"
                />
                <g clipPath="url(#glass-d-stem-clip)">
                    <path
                        d={BOWL}
                        fill="none"
                        stroke="url(#glass-d-violet)"
                        strokeWidth={BOWL_WIDTH}
                        strokeLinecap="round"
                    />
                </g>
                <g mask="url(#glass-d-bowl-mask)">
                    <path
                        d={BOWL}
                        fill="none"
                        stroke="#fff"
                        strokeWidth="36"
                        strokeLinecap="round"
                        opacity="0.2"
                        filter="url(#glass-d-soft)"
                        transform="translate(-28 -50)"
                    />
                    <path
                        d={BOWL}
                        fill="none"
                        stroke="#08104a"
                        strokeWidth="30"
                        strokeLinecap="round"
                        opacity="0.16"
                        filter="url(#glass-d-soft)"
                        transform="translate(26 52)"
                    />
                </g>
            </g>
        </svg>
    );
}
