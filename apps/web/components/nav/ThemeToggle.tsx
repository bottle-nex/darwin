"use client";

import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/store/theme/useThemeStore";
import { PiMoonBold, PiSunBold } from "react-icons/pi";

export function ThemeToggle({ isMarkettingPage = false }: { isMarkettingPage?: boolean }) {
    const theme = useThemeStore((s) => s.theme);
    const toggleTheme = useThemeStore((s) => s.toggleTheme);

    return (
        <Button
            variant={isMarkettingPage ? "tertiary" : "secondary"}
            size="icon"
            aria-label="Toggle theme"
            onClick={toggleTheme}
        >
            {theme === "dark" ? <PiSunBold /> : <PiMoonBold />}
        </Button>
    );
}
