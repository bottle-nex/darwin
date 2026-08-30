"use client";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export default function SettingsPaneShell({
    sectionKey,
    wide,
    children,
}: {
    sectionKey: string;
    wide?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto px-6 py-10">
            <motion.div
                key={sectionKey}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                className={cn("mx-auto flex min-h-full w-full flex-col", !wide && "max-w-200")}
            >
                {children}
            </motion.div>
        </div>
    );
}
