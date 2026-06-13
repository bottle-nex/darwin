interface AppLogoProps {
    iconOnly?: boolean;
    className?: string;
}

export default function AppLogo({ iconOnly = false, className = "" }: AppLogoProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <svg
                viewBox="0 0 32 32"
                fill="none"
                className="h-7 w-7 shrink-0 drop-shadow-[0_2px_6px_rgba(126,107,230,0.35)]"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient
                        id="matcha-logo-base"
                        x1="4"
                        y1="3"
                        x2="28"
                        y2="30"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0" stopColor="#C7B9FF" />
                        <stop offset="0.55" stopColor="#9D8AF5" />
                        <stop offset="1" stopColor="#6C55DE" />
                    </linearGradient>
                    <radialGradient
                        id="matcha-logo-sheen"
                        cx="0"
                        cy="0"
                        r="1"
                        gradientUnits="userSpaceOnUse"
                        gradientTransform="translate(16 1.5) rotate(90) scale(17 21)"
                    >
                        <stop offset="0" stopColor="#fff" stopOpacity="0.4" />
                        <stop offset="1" stopColor="#fff" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient
                        id="matcha-logo-edge"
                        x1="16"
                        y1="1.5"
                        x2="16"
                        y2="30.5"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
                        <stop offset="1" stopColor="#fff" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="matcha-logo-lid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#fff" stopOpacity="1" />
                        <stop offset="1" stopColor="#fff" stopOpacity="0.75" />
                    </linearGradient>
                    <linearGradient id="matcha-logo-face-right" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#fff" stopOpacity="0.92" />
                        <stop offset="1" stopColor="#fff" stopOpacity="0.5" />
                    </linearGradient>
                    <linearGradient id="matcha-logo-face-left" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
                        <stop offset="1" stopColor="#fff" stopOpacity="0.38" />
                    </linearGradient>
                </defs>
                <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="url(#matcha-logo-base)" />
                <rect
                    x="1.5"
                    y="1.5"
                    width="29"
                    height="29"
                    rx="9"
                    fill="url(#matcha-logo-sheen)"
                />
                <rect
                    x="2.1"
                    y="2.1"
                    width="27.8"
                    height="27.8"
                    rx="8.4"
                    stroke="url(#matcha-logo-edge)"
                    strokeWidth="0.8"
                />
                {/* Exploded isometric cube: floating lid over an open body */}
                <path d="M7.9 12.6L16 8.4L24.1 12.6L16 16.9Z" fill="#fff" fillOpacity="0.25" />
                <path d="M16 5.4L24.1 9.6L16 13.9L7.9 9.6Z" fill="url(#matcha-logo-lid)" />
                <path d="M7.9 12.6L16 16.9V25.6L7.9 21.4Z" fill="url(#matcha-logo-face-left)" />
                <path d="M24.1 12.6L16 16.9V25.6L24.1 21.4Z" fill="url(#matcha-logo-face-right)" />
            </svg>
            {!iconOnly && (
                <span className="text-xl font-semibold leading-none tracking-tight">
                    <span className="font-normal opacity-55">try</span>matcha
                    <span className="text-[#8B77EC]">.</span>
                </span>
            )}
        </div>
    );
}
