"use client";
import { motion } from "motion/react";
import { FaClock, FaFolder, FaUsers } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import type { Organization, OrgRole } from "@/types/organization";
import { FaIndustry } from "react-icons/fa";
import IconWrapper from "../ui/IconWrapper";

const ROLE_STYLES: Record<OrgRole, string> = {
    Owner: "bg-purple-500/10 text-emerald-300 ring-emerald-400/20",
    Admin: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
    Member: "bg-white/5 text-neutral-300 ring-white/10",
    Billing: "bg-sky-500/10 text-sky-300 ring-sky-400/20",
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
    const { name, slug, description, role, memberCount, projectCount, createdAt } = organization;

    return (
        <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            className="flex w-full cursor-pointer flex-col gap-4 rounded-sm border border-neutral-800 bg-neutral-900 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <IconWrapper
                        icon={<FaIndustry className="size-3" />}
                        stroke_color="text-indigo-100"
                        bg_color="bg-indigo-600"
                    />
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-medium text-neutral-100">{name}</h3>
                        <p className="truncate font-mono text-xs text-neutral-500">@{slug}</p>
                    </div>
                </div>
                <span
                    className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                        ROLE_STYLES[role],
                    )}
                >
                    {role}
                </span>
            </div>

            <p className="line-clamp-2 min-h-10 text-xs leading-relaxed text-neutral-400">
                {description?.trim() || "No description provided."}
            </p>

            <div className="flex items-center gap-4 border-t border-white/6 pt-3 text-[11px] text-neutral-500 [&_svg]:text-neutral-600">
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
