"use client";

export default function StickLine() {
    return (
        <div
            className="fixed top-0 left-1/2 h-screen w-px pointer-events-none z-50"
            style={{
                transform: "translateX(-0.5px)",
                background:
                    "linear-gradient(to bottom, transparent 0%, rgba(231,0,11,0.8) 6%, rgba(231,0,11,0.35) 100%)",
            }}
        />
    );
}
