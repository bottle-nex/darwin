"use client";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { FaClock, FaFolder } from "react-icons/fa6";
import { formatRelativeTime } from "@/lib/format";
import type { Project } from "@/types/project";

const DEFAULT_COLOR = "#6366f1";

export default function ProjectCard({
    project,
    orgSlug,
    index = 0,
}: {
    project: Project;
    orgSlug: string;
    index?: number;
}) {
    const router = useRouter();
    const { name, slug, description, color, createdAt } = project;
    const accent = color ?? DEFAULT_COLOR;

    return (
        <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push(`/playground/${orgSlug}/${slug}`)}
            className="flex w-full cursor-pointer flex-col gap-4 rounded-[14px] bg-linear-to-b from-[#1a1a1a] to-neutral-900 p-5 text-left shadow-[inset_0_2px_0_0_#262626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor: accent }}
                    >
                        <FaFolder className="size-3 text-white" />
                    </span>
                    <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-semibold tracking-tight text-neutral-50">
                            {name}
                        </h3>
                        <p className="truncate font-mono text-[11px] tracking-tight text-neutral-500">
                            @{slug}
                        </p>
                    </div>
                </div>
            </div>

            <p className="line-clamp-2 min-h-10 text-[13px] leading-relaxed text-neutral-400">
                {description?.trim() || "No description provided."}
            </p>

            <div className="flex items-center gap-4 border-t border-white/10 pt-3 text-[11px] tracking-tight text-neutral-500 tabular-nums [&_svg]:text-neutral-600">
                <span className="ml-auto flex items-center gap-1.5">
                    <FaClock className="size-3" />
                    {formatRelativeTime(createdAt)}
                </span>
            </div>
        </motion.button>
    );
}
