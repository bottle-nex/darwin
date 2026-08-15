"use client";

import { motion, useReducedMotion } from "motion/react";
import { draw, fade, POP_ORIGIN, pop } from "./diagramMotion";
import LandingSection from "./LandingSection";
import SectionHeader from "./SectionHeader";

const OCTOCAT_PATH =
    "M128.001 0C57.317 0 0 57.307 0 128.001c0 56.554 36.676 104.535 87.535 121.46c6.397 1.185 8.746-2.777 8.746-6.158c0-3.052-.12-13.135-.174-23.83c-35.61 7.742-43.124-15.103-43.124-15.103c-5.823-14.795-14.213-18.73-14.213-18.73c-11.613-7.944.876-7.78.876-7.78c12.853.902 19.621 13.19 19.621 13.19c11.417 19.568 29.945 13.911 37.249 10.64c1.149-8.272 4.466-13.92 8.127-17.116c-28.431-3.236-58.318-14.212-58.318-63.258c0-13.975 5-25.394 13.188-34.358c-1.329-3.224-5.71-16.242 1.24-33.874c0 0 10.749-3.44 35.21 13.121c10.21-2.836 21.16-4.258 32.038-4.307c10.878.049 21.837 1.47 32.066 4.307c24.431-16.56 35.165-13.12 35.165-13.12c6.967 17.63 2.584 30.65 1.255 33.873c8.207 8.964 13.173 20.383 13.173 34.358c0 49.163-29.944 59.988-58.447 63.157c4.591 3.972 8.682 11.762 8.682 23.704c0 17.126-.148 30.91-.148 35.126c0 3.407 2.304 7.398 8.792 6.14C219.37 232.5 256 184.537 256 128.002C256 57.307 198.691 0 128.001 0";

const PILL_VARIANTS = {
    solid: { fill: "#ffffff", stroke: "none", text: "#0a0a0a" },
    muted: { fill: "#262626", stroke: "none", text: "#a3a3a3" },
    outline: { fill: "#161616", stroke: "#d4d4d4", text: "#e5e5e5" },
} as const;

function DbGlyph({ cx, cy, color }: { cx: number; cy: number; color: string }) {
    return (
        <g stroke={color} strokeWidth={1.5} fill="none">
            <ellipse cx={cx} cy={cy - 4.5} rx={5.5} ry={2.4} />
            <path d={`M${cx - 5.5} ${cy - 4.5}v9a5.5 2.4 0 0 0 11 0v-9`} />
            <path d={`M${cx - 5.5} ${cy}a5.5 2.4 0 0 0 11 0`} />
        </g>
    );
}

function BranchPill({
    x,
    y,
    width,
    label,
    variant,
    delay,
}: {
    x: number;
    y: number;
    width: number;
    label: string;
    variant: keyof typeof PILL_VARIANTS;
    delay: number;
}) {
    const style = PILL_VARIANTS[variant];
    return (
        <motion.g variants={pop(delay)} className={POP_ORIGIN}>
            <rect
                x={x}
                y={y - 20}
                width={width}
                height={40}
                rx={20}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={1.5}
            />
            <DbGlyph cx={x + 21} cy={y} color={style.text} />
            <text x={x + 35} y={y + 6} fontSize={17} fill={style.text}>
                {label}
            </text>
        </motion.g>
    );
}

function CheckDot({ x, y, delay }: { x: number; y: number; delay: number }) {
    return (
        <motion.g variants={pop(delay)} className={POP_ORIGIN}>
            <circle cx={x} cy={y} r={10} fill="var(--color-primary)" />
            <path
                d={`M${x - 4.5} ${y + 0.5}l3.5 3.5 6.5-7`}
                stroke="#0a0a0a"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </motion.g>
    );
}

function JunctionDot({ x, y, delay }: { x: number; y: number; delay: number }) {
    return (
        <motion.circle
            variants={pop(delay)}
            className={POP_ORIGIN}
            cx={x}
            cy={y}
            r={6}
            fill="#0a0a0a"
            stroke="var(--color-primary)"
            strokeWidth={2}
        />
    );
}

function MonoLabel({
    x,
    y,
    text,
    delay,
    anchor = "middle",
    dim = false,
}: {
    x: number;
    y: number;
    text: string;
    delay: number;
    anchor?: "start" | "middle" | "end";
    dim?: boolean;
}) {
    return (
        <motion.text
            variants={fade(delay)}
            x={x}
            y={y}
            fontSize={17}
            textAnchor={anchor}
            fill={dim ? "#525252" : "#737373"}
        >
            {text}
        </motion.text>
    );
}

function Stub({ x, y1, y2, delay }: { x: number; y1: number; y2: number; delay: number }) {
    return (
        <motion.line
            variants={fade(delay)}
            x1={x}
            y1={y1}
            x2={x}
            y2={y2}
            stroke="#4a4a4a"
            strokeWidth={1.5}
            strokeDasharray="2 6"
            strokeLinecap="round"
        />
    );
}

function BranchCurve({ d, delay }: { d: string; delay: number }) {
    return (
        <motion.path
            variants={fade(delay)}
            d={d}
            stroke="#4a4a4a"
            strokeWidth={1.5}
            strokeDasharray="1.5 7"
            strokeLinecap="round"
            fill="none"
        />
    );
}

function LaneLine({
    x1,
    x2,
    y,
    stroke,
    delay,
    duration,
}: {
    x1: number;
    x2: number;
    y: number;
    stroke: string;
    delay: number;
    duration: number;
}) {
    return (
        <motion.line
            variants={draw(delay, duration)}
            x1={x1}
            y1={y}
            x2={x2}
            y2={y}
            stroke={stroke}
            strokeWidth={2}
        />
    );
}

const SWEEP = {
    duration: 4.5,
    ease: "linear" as const,
};

function ShootingStar({ y }: { y: number }) {
    return (
        <g>
            <line x1={0} y1={y} x2={1360} y2={y} stroke="#2e2e2e" strokeWidth={1.5} />
            <motion.line
                variants={{
                    hidden: { pathLength: 0 },
                    visible: {
                        pathLength: [0, 0, 1, 1],
                        transition: {
                            pathLength: { ...SWEEP, times: [0, 200 / 1760, 1560 / 1760, 1] },
                        },
                    },
                }}
                x1={0}
                y1={y}
                x2={1360}
                y2={y}
                stroke="var(--color-primary)"
                strokeOpacity={0.9}
                strokeWidth={1.5}
            />
            <motion.g
                variants={{
                    hidden: { x: -200, opacity: 0 },
                    visible: {
                        x: 1560,
                        opacity: 1,
                        transition: {
                            opacity: { duration: 0.01 },
                            x: SWEEP,
                        },
                    },
                }}
            >
                <line
                    x1={-180}
                    y1={y}
                    x2={0}
                    y2={y}
                    stroke="url(#comet-tail)"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                />
                <line
                    x1={-180}
                    y1={y}
                    x2={0}
                    y2={y}
                    stroke="url(#comet-core)"
                    strokeWidth={1.25}
                    strokeLinecap="round"
                />{" "}
            </motion.g>
        </g>
    );
}

function NodeCircle({
    x,
    y,
    delay,
    children,
}: {
    x: number;
    y: number;
    delay: number;
    children: React.ReactNode;
}) {
    return (
        <motion.g variants={pop(delay)} className={POP_ORIGIN}>
            <circle cx={x} cy={y} r={22} fill="#161616" stroke="#333333" strokeWidth={1.5} />
            {children}
        </motion.g>
    );
}

function BranchingDiagram() {
    const reduceMotion = useReducedMotion();
    return (
        <div className="relative">
            <motion.svg
                viewBox="0 0 1360 560"
                className="h-auto w-full font-mono"
                role="img"
                aria-label="Branch timeline: an agent branches production, runs checks, and merges a pull request"
                initial={reduceMotion ? false : "hidden"}
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
            >
                <defs>
                    <pattern
                        id="grid-columns"
                        width={40}
                        height={560}
                        patternUnits="userSpaceOnUse"
                    >
                        <line
                            x1={0.5}
                            y1={0}
                            x2={0.5}
                            y2={560}
                            stroke="#191919"
                            strokeWidth={1}
                            strokeDasharray="4 6"
                        />
                    </pattern>
                    <pattern
                        id="ruler-tick"
                        x={0}
                        y={278}
                        width={80}
                        height={24}
                        patternUnits="userSpaceOnUse"
                    >
                        <line
                            x1={0.5}
                            y1={2}
                            x2={0.5}
                            y2={22}
                            stroke="var(--color-primary)"
                            strokeOpacity={0.55}
                            strokeWidth={1}
                        />
                        <line x1={40.5} y1={2} x2={40.5} y2={22} stroke="#333333" strokeWidth={1} />
                    </pattern>
                    <radialGradient id="grid-fade" cx="0.5" cy="0.5" r="0.72">
                        <stop offset="0" stopColor="#ffffff" />
                        <stop offset="0.55" stopColor="#ffffff" />
                        <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
                    </radialGradient>
                    <linearGradient id="grid-fade-y" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#000000" />
                        <stop offset="0.35" stopColor="#000000" stopOpacity={0} />
                        <stop offset="0.65" stopColor="#000000" stopOpacity={0} />
                        <stop offset="1" stopColor="#000000" />
                    </linearGradient>
                    <mask id="grid-mask">
                        <rect x={0} y={0} width={1360} height={560} fill="url(#grid-fade)" />
                        <rect x={0} y={0} width={1360} height={560} fill="url(#grid-fade-y)" />
                    </mask>
                    <linearGradient
                        id="fade-preview"
                        gradientUnits="userSpaceOnUse"
                        x1={372}
                        y1={0}
                        x2={800}
                        y2={0}
                    >
                        <stop offset="0" stopColor="#2e2e2e" />
                        <stop offset="0.85" stopColor="#2e2e2e" />
                        <stop offset="1" stopColor="#2e2e2e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                        id="fade-test"
                        gradientUnits="userSpaceOnUse"
                        x1={634}
                        y1={0}
                        x2={1240}
                        y2={0}
                    >
                        <stop offset="0" stopColor="#2e2e2e" />
                        <stop offset="0.78" stopColor="#2e2e2e" />
                        <stop offset="1" stopColor="#2e2e2e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                        id="comet-tail"
                        gradientUnits="userSpaceOnUse"
                        x1={-180}
                        y1={0}
                        x2={0}
                        y2={0}
                    >
                        <stop offset="0" stopColor="var(--color-primary)" stopOpacity={0} />
                        <stop offset="0.5" stopColor="var(--color-primary)" stopOpacity={0.45} />
                        <stop offset="1" stopColor="var(--color-primary)" stopOpacity={0.85} />
                    </linearGradient>
                    <linearGradient
                        id="comet-core"
                        gradientUnits="userSpaceOnUse"
                        x1={-180}
                        y1={0}
                        x2={0}
                        y2={0}
                    >
                        <stop offset="0" stopColor="#e8e3fd" stopOpacity={0} />
                        <stop offset="0.55" stopColor="#e8e3fd" stopOpacity={0.55} />
                        <stop offset="1" stopColor="#e8e3fd" stopOpacity={1} />
                    </linearGradient>
                    <clipPath id="avatar-clip">
                        <circle cx={956} cy={208} r={21} />
                    </clipPath>
                </defs>

                <motion.rect
                    variants={fade(0)}
                    x={0}
                    y={0}
                    width={1360}
                    height={560}
                    fill="url(#grid-columns)"
                    mask="url(#grid-mask)"
                />
                <rect x={0} y={278} width={1360} height={24} fill="url(#ruler-tick)" />

                <g>
                    <BranchCurve d="M310 282C310 220 310 126 372 126" delay={0.55} />
                    <LaneLine
                        x1={372}
                        x2={800}
                        y={126}
                        stroke="url(#fade-preview)"
                        delay={1}
                        duration={0.7}
                    />
                    <NodeCircle x={310} y={208} delay={0.75}>
                        <path d="M310 200l8.5 15h-17z" fill="#d4d4d4" />
                    </NodeCircle>
                    <BranchPill
                        x={372}
                        y={126}
                        width={190}
                        label="preview-branch"
                        variant="muted"
                        delay={0.9}
                    />
                    <Stub x={604} y1={70} y2={110} delay={1.3} />
                    <Stub x={736} y1={70} y2={110} delay={1.45} />
                    <MonoLabel x={604} y={58} text="PR open" delay={1.35} />
                    <MonoLabel x={736} y={58} text="PR merged" delay={1.5} />
                    <CheckDot x={604} y={126} delay={1.25} />
                    <CheckDot x={736} y={126} delay={1.4} />
                    <MonoLabel
                        x={772}
                        y={132}
                        text="branch deleted"
                        anchor="start"
                        dim
                        delay={1.6}
                    />
                </g>

                <g>
                    <BranchCurve d="M574 298C574 360 574 454 634 454" delay={0.75} />
                    <LaneLine
                        x1={634}
                        x2={1240}
                        y={454}
                        stroke="url(#fade-test)"
                        delay={1.2}
                        duration={0.8}
                    />
                    <NodeCircle x={574} y={382} delay={0.95}>
                        <g transform="translate(562.5 371) scale(0.09)">
                            <path d={OCTOCAT_PATH} fill="#a3a3a3" />
                        </g>
                    </NodeCircle>
                    <BranchPill
                        x={634}
                        y={454}
                        width={158}
                        label="test-branch"
                        variant="muted"
                        delay={1.1}
                    />
                    <Stub x={866} y1={468} y2={508} delay={1.5} />
                    <Stub x={1010} y1={468} y2={508} delay={1.65} />
                    <MonoLabel x={866} y={522} text="tests running" delay={1.55} />
                    <MonoLabel x={1010} y={522} text="checks passed" delay={1.7} />
                    <CheckDot x={866} y={454} delay={1.45} />
                    <CheckDot x={1010} y={454} delay={1.6} />
                    <motion.circle
                        variants={pop(1.8)}
                        className={POP_ORIGIN}
                        cx={1090}
                        cy={454}
                        r={5}
                        fill="#333333"
                    />
                    <MonoLabel
                        x={1106}
                        y={460}
                        text="branch deleted"
                        anchor="start"
                        dim
                        delay={1.85}
                    />
                </g>

                <g>
                    <BranchCurve d="M956 282C956 220 956 126 1016 126" delay={1} />
                    <LaneLine
                        x1={1016}
                        x2={1360}
                        y={126}
                        stroke="#2e2e2e"
                        delay={1.45}
                        duration={0.6}
                    />
                    <motion.g variants={pop(1.2)} className={POP_ORIGIN}>
                        <circle
                            cx={956}
                            cy={208}
                            r={22}
                            fill="#161616"
                            stroke="#444444"
                            strokeWidth={1.5}
                        />
                        <image
                            href="/images/user.png"
                            x={935}
                            y={187}
                            width={42}
                            height={42}
                            preserveAspectRatio="xMidYMid slice"
                            clipPath="url(#avatar-clip)"
                        />
                    </motion.g>
                    <BranchPill
                        x={1016}
                        y={126}
                        width={148}
                        label="dev-branch"
                        variant="outline"
                        delay={1.35}
                    />
                    <Stub x={1250} y1={70} y2={110} delay={1.75} />
                    <MonoLabel x={1250} y={58} text="dev in progress" delay={1.8} />
                    <CheckDot x={1250} y={126} delay={1.7} />
                </g>

                {reduceMotion ? (
                    <line
                        x1={0}
                        y1={290}
                        x2={1360}
                        y2={290}
                        stroke="var(--color-primary)"
                        strokeOpacity={0.55}
                        strokeWidth={1.5}
                    />
                ) : (
                    <ShootingStar y={290} />
                )}

                <BranchPill
                    x={48}
                    y={290}
                    width={150}
                    label="production"
                    variant="solid"
                    delay={0.1}
                />
                <JunctionDot x={310} y={290} delay={0.45} />
                <JunctionDot x={574} y={290} delay={0.65} />
                <JunctionDot x={956} y={290} delay={0.9} />
                <MonoLabel x={310} y={324} text="18:24:00" delay={0.6} />
                <MonoLabel x={574} y={262} text="19:08:12" delay={0.8} />
                <MonoLabel x={956} y={324} text="20:32:04" delay={1.05} />
            </motion.svg>
        </div>
    );
}

export default function LandingIssueTracker() {
    return (
        <LandingSection>
            <SectionHeader
                title="From issue to review."
                titleContinued="An agent branches your repo, fixes it, and proves it."
                description="You open a finished pull request, not a half-built branch. The runner has already proven it works."
            />
            <div className="mt-16">
                <BranchingDiagram />
            </div>
        </LandingSection>
    );
}
