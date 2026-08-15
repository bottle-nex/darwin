import type { Metadata } from "next";
import { EditorialHero, PostCard } from "@trymatcha/editorial";
import { LandingNavbar } from "@/components/new/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import { landingContainer } from "@/components/landing/LandingSection";
import { cn } from "@/lib/utils";
import { getPosts } from "@/lib/content";

export const metadata: Metadata = {
    title: "Blog",
    description: "Notes on agents, boards, and shipping.",
};

export default async function BlogPage() {
    const posts = await getPosts();

    return (
        <main className="min-h-screen bg-ink">
            <LandingNavbar />

            <div className={cn(landingContainer, "pt-40 pb-20")}>
                <EditorialHero
                    title="Notes on agents,"
                    titleContinued="boards, and shipping."
                    description="What we are learning while building a board that empties itself."
                />

                <div className="mt-16">
                    {posts.length === 0 ? (
                        <p className="border-t border-graphite py-8 text-[15px] text-mist/35">
                            No posts published yet.
                        </p>
                    ) : (
                        posts.map((post) => (
                            <PostCard key={post.slug} post={post} href={`/blog/${post.slug}`} />
                        ))
                    )}
                </div>
            </div>

            <LandingFooter />
        </main>
    );
}
