"use client";
import { motion } from "motion/react";

export default function SettingsPaneShell({
    sectionKey,
    children,
}: {
    sectionKey: string;
    children: React.ReactNode;
}) {
    return (
        <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <motion.div
                key={sectionKey}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                className="mx-auto h-full w-full max-w-200"
            >
                {children}
            </motion.div>
        </div>
    );
}
