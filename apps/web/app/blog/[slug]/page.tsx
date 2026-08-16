import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MdArrowBack } from "react-icons/md";
import { CardCover, ContentCard, Prose } from "@trymatcha/editorial";
import { LandingNavbar } from "@/components/new/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import { landingContainer } from "@/components/landing/LandingSection";
import EntryByline from "@/components/blog/EntryByline";
import EntryCta from "@/components/blog/EntryCta";
import { cn } from "@/lib/utils";
import { getEntry, getPosts, getReleases } from "@/lib/content";

type EntryPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
    const [posts, releases] = await Promise.all([getPosts(), getReleases()]);
    return [...posts, ...releases].map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: EntryPageProps): Promise<Metadata> {
    const { slug } = await params;
    const entry = await getEntry(slug);
    if (!entry) return {};

    return {
        title: entry.title,
        description: entry.summary ?? undefined,
    };
}

export default async function EntryPage({ params }: EntryPageProps) {
    const { slug } = await params;
    const entry = await getEntry(slug);
    if (!entry) notFound();

    const tab = entry.kind === "Changelog" ? "changelog" : "blogs";
    const [posts, releases] = await Promise.all([getPosts(), getReleases()]);
    const more = [...posts, ...releases]
        .filter((candidate) => candidate.slug !== entry.slug)
        .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
        .slice(0, 3);

    return (
        <main className="min-h-screen bg-ink">
            <LandingNavbar />

            <header className={cn(landingContainer, "pt-36")}>
                <Link
                    href={`/blog?tab=${tab}`}
                    className="group inline-flex items-center gap-x-2 rounded-full border border-graphite bg-charcoal/60 py-1.5 pr-4 pl-3 text-[13px] text-mist/50 transition-colors hover:border-edge hover:bg-charcoal hover:text-snow"
                >
                    <MdArrowBack className="size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                    {entry.kind === "Changelog" ? "All changelogs" : "All posts"}
                </Link>

                <div className="mt-10 max-w-[820px]">
                    <EntryByline entry={entry} />

                    <h1 className="mt-5 font-headline text-[2.5rem] leading-[1.08] tracking-tight text-snow sm:text-[3.25rem]">
                        {entry.title}
                    </h1>

                    {entry.summary && (
                        <p className="mt-6 text-xl leading-relaxed text-mist/45">{entry.summary}</p>
                    )}
                </div>
            </header>

            <div className={cn(landingContainer, "mt-14")}>
                <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-10">
                    <div className="lg:col-span-7">
                        <CardCover
                            src={entry.coverImage}
                            title={entry.title}
                            version={entry.version}
                            size="feature"
                        />

                        <article className="mt-14 max-w-[680px]">
                            <Prose html={entry.content} />

                            {entry.tags.length > 0 && (
                                <div className="mt-16 flex flex-wrap gap-2 border-t border-graphite pt-8">
                                    {entry.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full border border-graphite px-3 py-1 font-mono text-[11px] tracking-widest text-mist/40 uppercase"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </article>
                    </div>

                    <aside className="lg:sticky lg:top-24 lg:col-span-3 lg:self-start">
                        <EntryCta />
                    </aside>
                </div>
            </div>

            {more.length > 0 && (
                <section className={cn(landingContainer, "mt-28")}>
                    <h2 className="font-mono text-[11px] tracking-[0.18em] text-mist/35 uppercase">
                        Keep reading
                    </h2>
                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {more.map((candidate) => (
                            <ContentCard
                                key={candidate.slug}
                                entry={candidate}
                                href={`/blog/${candidate.slug}`}
                            />
                        ))}
                    </div>
                </section>
            )}

            <LandingFooter />
        </main>
    );
}
