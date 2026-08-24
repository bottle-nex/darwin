import Link from "next/link";

import { cn } from "@/lib/utils";

export const BLOG_TABS = ["all", "changelog", "blogs"] as const;

export type BlogTab = (typeof BLOG_TABS)[number];

const LABELS: Record<BlogTab, string> = {
    all: "All",
    changelog: "Changelogs",
    blogs: "Blogs",
};

export function resolveTab(value: string | undefined): BlogTab {
    return BLOG_TABS.includes(value as BlogTab) ? (value as BlogTab) : "all";
}

export default function BlogTabs({ active }: { active: BlogTab }) {
    return (
        <div className="flex items-center gap-2">
            {BLOG_TABS.map((tab) => (
                <Link
                    key={tab}
                    href={tab === "all" ? "/blog" : `/blog?tab=${tab}`}
                    scroll={false}
                    className={cn(
                        "rounded-full px-4 py-1.5 text-[13px] transition-colors",
                        tab === active
                            ? "bg-snow text-ink"
                            : "bg-snow/10 text-snow/80 hover:bg-snow/15",
                    )}
                >
                    {LABELS[tab]}
                </Link>
            ))}
        </div>
    );
}
