"use client";

import { ReactLenis } from "lenis/react";

interface LenisProviderProps {
    children: React.ReactNode;
}

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function LenisProvider({ children }: LenisProviderProps) {
    return (
        <ReactLenis
            root
            options={{
                duration: 1.4,
                easing: easeOutExpo,
                wheelMultiplier: 1,
                touchMultiplier: 1.5,
                smoothWheel: true,
                syncTouch: true,
            }}
        >
            {children}
        </ReactLenis>
    );
}
