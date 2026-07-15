import { useEffect, useRef } from "react";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { Surface } from "@/components/playground/Sidebar/surface";
import { HomeTab } from "@/components/playground/Home/homeTabs";

interface Shortcut {
    keys: string;
    run: () => void;
}

function openHomeTab(tab: HomeTab) {
    const { setSurface, setTab } = usePlaygroundNavStore.getState();
    setSurface(Surface.Home);
    setTab(Surface.Home, tab);
}

const OPEN_TARGETS: Record<string, HomeTab> = {
    i: HomeTab.Inbox,
    k: HomeTab.Kanban,
    o: HomeTab.Overview,
    g: HomeTab.Gantt,
    t: HomeTab.Tags,
    m: HomeTab.Mentions,
};

const SHORTCUTS: Shortcut[] = Object.entries(OPEN_TARGETS).map(([key, tab]) => ({
    keys: `o ${key}`,
    run: () => openHomeTab(tab),
}));

const SEQUENCE_TIMEOUT_MS = 800;

function isTyping(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function matchKeys(keys: string[]): "matched" | "pending" | "none" {
    const sequence = keys.join(" ");
    const exact = SHORTCUTS.find((shortcut) => shortcut.keys === sequence);
    if (exact) {
        exact.run();
        return "matched";
    }
    const isPrefix = SHORTCUTS.some((shortcut) => shortcut.keys.startsWith(`${sequence} `));
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
            console.log("handleKeys", keys);
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
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            if (isTyping(event.target)) return;

            const key = event.key.toLowerCase();
            console.log("key at handle key down is ", key, pendingKeysRef.current);
            if (key.length !== 1) return;

            if (handleKeys([...pendingKeysRef.current, key])) {
                event.preventDefault();
                return;
            }
            reset();
            if (handleKeys([key])) event.preventDefault();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            reset();
        };
    }, []);
}
