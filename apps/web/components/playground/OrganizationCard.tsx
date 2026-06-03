"use client";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { FaClock, FaFolder, FaUsers } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import type { Organization, OrgRole } from "@/types/organization";
import { FaIndustry } from "react-icons/fa";
import IconWrapper from "../ui/IconWrapper";

const ROLE_DOT: Record<OrgRole, string> = {
    Owner: "bg-emerald-400 shadow-[0_0_6px_0] shadow-emerald-400/60",
    Admin: "bg-amber-400 shadow-[0_0_6px_0] shadow-amber-400/60",
    Member: "bg-neutral-400 shadow-[0_0_6px_0] shadow-neutral-400/50",
    Billing: "bg-sky-400 shadow-[0_0_6px_0] shadow-sky-400/60",
};

function pluralize(count: number, noun: string): string {
    return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export default function OrganizationCard({
    organization,
    index = 0,
}: {
    organization: Organization;
    index?: number;
}) {
    const router = useRouter();
    const { id, name, slug, description, role, memberCount, projectCount, createdAt } =
        organization;

    return (
        <motion.button
            type="button"
            onClick={() => router.push(`/playground/${id}`)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            className="flex w-full cursor-pointer flex-col gap-4 rounded-[14px] bg-linear-to-b from-[#1a1a1a] to-neutral-900 p-5 text-left shadow-[inset_0_2px_0_0_#262626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <IconWrapper
                        icon={<FaIndustry className="size-3" />}
                        stroke_color="text-indigo-100"
                        bg_color="bg-indigo-600"
                    />
                    <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-semibold tracking-tight text-neutral-50">
                            {name}
                        </h3>
                        <p className="truncate font-mono text-[11px] tracking-tight text-neutral-500">
                            @{slug}
                        </p>
                    </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-300 ring-1 ring-inset ring-white/10">
                    <span className={cn("size-1.5 rounded-full", ROLE_DOT[role])} aria-hidden />
                    {role}
                </span>
            </div>

            <p className="line-clamp-2 min-h-10 text-[13px] leading-relaxed text-neutral-400">
                {description?.trim() || "No description provided."}
            </p>

            <div className="flex items-center gap-4 border-t border-white/10 pt-3 text-[11px] tracking-tight text-neutral-500 tabular-nums [&_svg]:text-neutral-600">
                <span className="flex items-center gap-1.5">
                    <FaUsers className="size-3" />
                    {pluralize(memberCount, "member")}
                </span>
                <span className="flex items-center gap-1.5">
                    <FaFolder className="size-3" />
                    {pluralize(projectCount, "project")}
                </span>
                <span className="ml-auto flex items-center gap-1.5">
                    <FaClock className="size-3" />
                    {formatRelativeTime(createdAt)}
                </span>
            </div>
        </motion.button>
    );
}
