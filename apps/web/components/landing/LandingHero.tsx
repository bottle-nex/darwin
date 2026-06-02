"use client";
import { Doto } from "next/font/google";
import AppLogo from "../app/Applogo";
import { GiAbstract042 } from "react-icons/gi";

const doto = Doto({
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const VIEW_W = 1400;
const VIEW_H = 460;

const TOP_Y = 60;
const BOTTOM_Y = 400;
const CARD_TOP_Y = 110;
const CARD_BOTTOM_Y = 350;

const LEFT_ENTRY_X = 610;
const RIGHT_ENTRY_X = 790;
const ARC_R = 8;

const PATHS = [
    `M 0 ${TOP_Y} L 575 ${TOP_Y} A ${ARC_R} ${ARC_R} 0 0 1 582 63 L 607 88 A ${ARC_R} ${ARC_R} 0 0 1 ${LEFT_ENTRY_X} 95 L ${LEFT_ENTRY_X} ${CARD_TOP_Y}`,
    `M ${VIEW_W} ${TOP_Y} L 825 ${TOP_Y} A ${ARC_R} ${ARC_R} 0 0 0 818 63 L 793 88 A ${ARC_R} ${ARC_R} 0 0 0 ${RIGHT_ENTRY_X} 95 L ${RIGHT_ENTRY_X} ${CARD_TOP_Y}`,
    `M 0 ${BOTTOM_Y} L 575 ${BOTTOM_Y} A ${ARC_R} ${ARC_R} 0 0 0 582 397 L 607 372 A ${ARC_R} ${ARC_R} 0 0 0 ${LEFT_ENTRY_X} 365 L ${LEFT_ENTRY_X} ${CARD_BOTTOM_Y}`,
    `M ${VIEW_W} ${BOTTOM_Y} L 825 ${BOTTOM_Y} A ${ARC_R} ${ARC_R} 0 0 1 818 397 L 793 372 A ${ARC_R} ${ARC_R} 0 0 1 ${RIGHT_ENTRY_X} 365 L ${RIGHT_ENTRY_X} ${CARD_BOTTOM_Y}`,
];

const NODES = [
    { x: 60, y: TOP_Y },
    { x: 510, y: TOP_Y },
    { x: 890, y: TOP_Y },
    { x: 1340, y: TOP_Y },
    { x: 510, y: BOTTOM_Y },
    { x: 890, y: BOTTOM_Y },
];

const PILLS = [
    { text: "Customer", x: 380, y: TOP_Y },
    { text: "Code", x: 1080, y: TOP_Y },
    { text: "Bug", x: 290, y: BOTTOM_Y },
    { text: "Issues", x: 400, y: BOTTOM_Y },
    { text: "Ticket", x: 1010, y: BOTTOM_Y },
    { text: "Commit", x: 1110, y: BOTTOM_Y },
    { text: "PR", x: 1210, y: BOTTOM_Y },
];

export default function LandingHero() {
    return (
        <div className="min-h-screen w-screen relative overflow-hidden flex flex-col items-center pt-24 pb-20">
            <div className="absolute inset-0 pointer-events-none" />

            <div className="relative w-full aspect-1400/460">
                <svg
                    viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="absolute inset-0 w-full h-full"
                    fill="none"
                >
                    {PATHS.map((d, i) => (
                        <path
                            key={i}
                            d={d}
                            stroke="#d8d8d8"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    ))}

                    {NODES.map((n, i) => (
                        <circle key={i} cx={n.x} cy={n.y} r={5} fill="#000" />
                    ))}

                    <rect x={580} y={110} width={240} height={240} rx={40} fill="#ebe7e2" />
                    <rect x={610} y={140} width={180} height={180} rx={28} fill="#ffffff" />
                    <foreignObject x={640} y={170} width={120} height={120}>
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <GiAbstract042 style={{ width: "100%", height: "100%" }} />
                        </div>
                    </foreignObject>
                </svg>

                {PILLS.map((p, i) => (
                    <div
                        key={i}
                        className="absolute -translate-x-1/2 -translate-y-1/2 h-7 px-4 rounded-full bg-[#f7f7f7] border border-[#d8d8d8] text-[12px] font-medium text-[#1d0f0f] flex items-center justify-center whitespace-nowrap tracking-wide"
                        style={{
                            left: `${(p.x / VIEW_W) * 100}%`,
                            top: `${(p.y / VIEW_H) * 100}%`,
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                        }}
                    >
                        {p.text}
                    </div>
                ))}
            </div>

            <div className="mt-12"></div>

            <p className="relative mt-10 max-w-[500px] text-center text-[#6f6f6f] text-[20px] leading-[1.5] px-4">
                PlayerZero brings AI to a new era of software development beyond the code editor.
            </p>

            <div className="relative mt-8 inline-flex items-center bg-[#1d0f0f] rounded-[20px] p-1.5">
                <div className="w-14 h-14 bg-[#ff6b42] rounded-2xl flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-[3px]">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="w-[5px] h-[5px] rounded-full bg-white" />
                        ))}
                    </div>
                </div>
                <div className="px-5 pr-6 text-white text-[16px] font-semibold">Request a Demo</div>
            </div>
        </div>
    );
}

function DotText({ text }: { text: string }) {
    return (
        <h2
            className="relative text-center font-black select-none"
            style={{
                fontSize: 90,
                lineHeight: 1,
                letterSpacing: "0.08em",
                color: "transparent",
                backgroundImage: "radial-gradient(circle, #1d0f0f 2px, transparent 2.5px)",
                backgroundSize: "10px 10px",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            }}
        >
            {text}
        </h2>
    );
}

function Logo() {
    return (
        <svg viewBox="0 0 100 100" className="w-[88px] h-[88px]" fill="#0a0a0a">
            <rect x="30" y="4" width="40" height="36" rx="6" />
            <rect x="30" y="60" width="40" height="36" rx="6" />
            <rect x="4" y="30" width="36" height="40" rx="6" />
            <rect x="60" y="30" width="36" height="40" rx="6" />
        </svg>
    );
}
