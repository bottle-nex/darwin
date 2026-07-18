"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme/useThemeStore";

export default function ThemeInitializer() {
    useEffect(() => {
        useThemeStore.persist.rehydrate();
    }, []);

    return null;
}
