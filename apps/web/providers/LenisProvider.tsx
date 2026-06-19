"use client";

import { ReactLenis } from "lenis/react";

interface LenisProviderProps {
    children: React.ReactNode;
}

export default function LenisProvider({ children }: LenisProviderProps) {
    return (
        <ReactLenis
            root
            options={{
                lerp: 0.075,
                wheelMultiplier: 1.15,
                touchMultiplier: 1.8,
                smoothWheel: true,
            }}
        >
            {children}
        </ReactLenis>
    );
}
