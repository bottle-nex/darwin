import { create } from "zustand";
import { persist } from "zustand/middleware";

export const BACKGROUND_LIGHTING_DEFAULT_ANGLE = 210;
export const BACKGROUND_LIGHTING_STORAGE_KEY = "playground-background-lighting";

function clampAngle(angle: number): number {
    if (!Number.isFinite(angle)) return BACKGROUND_LIGHTING_DEFAULT_ANGLE;
    return Math.min(360, Math.max(0, Math.round(angle)));
}

interface BackgroundLightingState {
    angle: number;
    setAngle: (angle: number) => void;
}

export const useBackgroundLightingStore = create<BackgroundLightingState>()(
    persist(
        (set) => ({
            angle: BACKGROUND_LIGHTING_DEFAULT_ANGLE,
            setAngle: (angle) => set({ angle: clampAngle(angle) }),
        }),
        {
            name: BACKGROUND_LIGHTING_STORAGE_KEY,
            version: 1,
            skipHydration: true,
            partialize: (state) => ({ angle: state.angle }),
            merge: (persistedState, currentState) => ({
                ...currentState,
                angle: clampAngle(
                    (persistedState as Partial<BackgroundLightingState> | undefined)?.angle ??
                        BACKGROUND_LIGHTING_DEFAULT_ANGLE,
                ),
            }),
        },
    ),
);
