import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EntryNav, Prose, formatDate } from "@trymatcha/editorial";
import { LandingNavbar } from "@/components/new/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import { landingContainer } from "@/components/landing/LandingSection";
import { cn } from "@/lib/utils";
import { getPost, getPosts } from "@/lib/content";

type PostPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
    const posts = await getPosts();
    return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPost(slug);
    if (!post) return {};

    return { title: post.title, description: post.summary ?? undefined };
}

export default async function PostPage({ params }: PostPageProps) {
    const { slug } = await params;
    const [post, posts] = await Promise.all([getPost(slug), getPosts()]);
    if (!post) notFound();

    const index = posts.findIndex((entry) => entry.slug === slug);
    const newer = index > 0 ? posts[index - 1] : undefined;
    const older = index >= 0 && index < posts.length - 1 ? posts[index + 1] : undefined;

    return (
        <main className="min-h-screen bg-ink">
            <LandingNavbar />

            <div className={cn(landingContainer, "pt-36 pb-20")}>
                <Link
                    href="/blog"
                    className="font-mono text-[11px] tracking-widest text-mist/40 uppercase transition-colors hover:text-snow"
                >
                    ← Blog
                </Link>

                <article className="mt-10">
                    <div className="flex items-center gap-x-3 font-mono text-xs tracking-widest text-mist/40">
                        <span>{formatDate(post.publishedAt)}</span>
                        {post.author && (
                            <>
                                <span className="text-mist/20">/</span>
                                <span>{post.author}</span>
                            </>
                        )}
                    </div>

                    <h1 className="mt-4 max-w-[680px] text-[2rem] leading-tight tracking-tight text-snow">
                        {post.title}
                    </h1>

                    <Prose className="mt-8" html={post.content} />
                </article>

                <div className="mt-20">
                    <EntryNav
                        previous={
                            older ? { href: `/blog/${older.slug}`, label: older.title } : undefined
                        }
                        next={
                            newer ? { href: `/blog/${newer.slug}`, label: newer.title } : undefined
                        }
                    />
                </div>
            </div>

            <LandingFooter />
        </main>
    );
}
