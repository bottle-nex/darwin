import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { useEffect, useSyncExternalStore } from "react";
import { motion } from "framer-motion";

interface OpacityBackgroundProps {
    children: React.ReactNode;
    className?: string;
    onBackgroundClick?: () => void;
    escapeClosing?: boolean;
}

const emptySubscribe = () => () => {};

// Returns false during SSR and the first hydration pass, true once on the client.
// Guards createPortal, which needs document.body, without setState-in-effect.
function useIsClient() {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );
}

export default function OpacityBackground({
    children,
    className,
    onBackgroundClick,
    escapeClosing = false,
}: OpacityBackgroundProps) {
    const isClient = useIsClient();

    useEffect(() => {
        if (!escapeClosing) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && onBackgroundClick) {
                onBackgroundClick();
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [escapeClosing, onBackgroundClick]);

    const handleBackgroundClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && onBackgroundClick) {
            onBackgroundClick();
        }
    };

    const backgroundElement = (
        <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(1px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
                "fixed w-screen h-screen inset-0 backdrop-blur-[1px] flex items-center justify-center z-50",
                className,
            )}
            onClick={handleBackgroundClick}
        >
            {children}
        </motion.div>
    );

    if (!isClient) return null;
    return createPortal(backgroundElement, document.body);
}
