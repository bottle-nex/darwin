import type { Metadata } from "next";

import AllEntries from "@/components/blog/AllEntries";
import BlogEntries from "@/components/blog/BlogEntries";
import BlogHero from "@/components/blog/BlogHero";
import { resolveTab } from "@/components/blog/BlogTabs";
import ChangelogEntries from "@/components/blog/ChangelogEntries";
import LandingFooter from "@/components/landing/LandingFooter";
import { landingContainer } from "@/components/landing/LandingSection";
import { LandingNavbar } from "@/components/new/LandingNavbar";
import { getPosts, getReleases } from "@/lib/content";

export const metadata: Metadata = {
    title: "What's new in Matcha",
    description: "Releases, notes on agents, and everything we have been shipping.",
};

type BlogPageProps = { searchParams: Promise<{ tab?: string }> };

export default async function BlogPage({ searchParams }: BlogPageProps) {
    const { tab } = await searchParams;
    const active = resolveTab(tab);

    const [posts, releases] = await Promise.all([getPosts(), getReleases()]);
    const everything = [...posts, ...releases].sort((a, b) =>
        (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
    );

    return (
        <main data-lenis-prevent className="min-h-screen bg-ink">
            <LandingNavbar />
            <BlogHero active={active} />

            <div className={landingContainer}>
                {active === "blogs" && <BlogEntries entries={posts} />}
                {active === "changelog" && <ChangelogEntries entries={releases} />}
                {active === "all" && <AllEntries entries={everything} />}
            </div>

            <LandingFooter />
        </main>
    );
}
