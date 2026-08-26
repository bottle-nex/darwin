"use client";

import { createContext, type ReactNode, useContext } from "react";

const FixtureContext = createContext("isolated");

export function FixtureProvider({ children }: { children: ReactNode }) {
    return <FixtureContext.Provider value="inherited">{children}</FixtureContext.Provider>;
}

export function useFixtureContext() {
    return useContext(FixtureContext);
}
