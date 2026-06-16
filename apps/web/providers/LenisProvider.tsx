"use client";

import { ReactLenis } from "lenis/react";

interface LenisProviderProps {
    children: React.ReactNode;
}

export default function LenisProvider({ children }: LenisProviderProps) {
    return <ReactLenis root>{children}</ReactLenis>;
}
