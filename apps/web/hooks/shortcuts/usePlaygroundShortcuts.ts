import { useEffect, useRef } from "react";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useShortcutSheetStore } from "@/store/playground/useShortcutSheetStore";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";

interface Combination {
    label: string;
    run: () => void;
}

function openTab(tab: PlaygroundTab) {
    usePlaygroundNavStore.getState().setTab(tab);
}

export const COMBINATIONS: Record<string, Combination> = {
    "mod+/": { label: "Toggle shortcuts", run: () => useShortcutSheetStore.getState().open() },
    "o i": { label: "Open Threads", run: () => openTab(PlaygroundTab.Threads) },
    "o k": { label: "Open Kanban", run: () => openTab(PlaygroundTab.Kanban) },
    "o o": { label: "Open Overview", run: () => openTab(PlaygroundTab.Overview) },
    "o g": { label: "Open Gantt", run: () => openTab(PlaygroundTab.Gantt) },
    "o t": { label: "Open Tags", run: () => openTab(PlaygroundTab.Tags) },
    "o m": { label: "Open Mentions", run: () => openTab(PlaygroundTab.Mentions) },
    "o r": { label: "Open Reviews", run: () => openTab(PlaygroundTab.Reviews) },
};

const SEQUENCE_TIMEOUT_MS = 800;

function isTyping(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function matchKeys(keys: string[]): "matched" | "pending" | "none" {
    const sequence = keys.join(" ");
    const combination = COMBINATIONS[sequence];
    if (combination) {
        combination.run();
        return "matched";
    }
    const isPrefix = Object.keys(COMBINATIONS).some((combo) => combo.startsWith(`${sequence} `));
    return isPrefix ? "pending" : "none";
}

export default function usePlaygroundShortcuts() {
    const pendingKeysRef = useRef<string[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        function reset() {
            pendingKeysRef.current = [];
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        }

        function startResetTimer() {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(reset, SEQUENCE_TIMEOUT_MS);
        }

        function handleKeys(keys: string[]): boolean {
            const outcome = matchKeys(keys);
            if (outcome === "matched") {
                reset();
                return true;
            }
            if (outcome === "pending") {
                pendingKeysRef.current = keys;
                startResetTimer();
                return true;
            }
            return false;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.altKey) return;
            if (isTyping(event.target)) return;

            const key = event.key.toLowerCase();
            if (key.length !== 1) return;

            const token = event.metaKey || event.ctrlKey ? `mod+${key}` : key;

            if (handleKeys([...pendingKeysRef.current, token])) {
                event.preventDefault();
                return;
            }
            reset();
            if (handleKeys([token])) event.preventDefault();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            reset();
        };
    }, []);
}
