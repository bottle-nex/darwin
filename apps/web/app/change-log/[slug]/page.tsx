import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EntryNav, ReleaseSection } from "@trymatcha/editorial";
import { LandingNavbar } from "@/components/new/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import { landingContainer } from "@/components/landing/LandingSection";
import { cn } from "@/lib/utils";
import { getRelease, getReleases } from "@/lib/content";

type ReleasePageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
    const releases = await getReleases();
    return releases.map((release) => ({ slug: release.slug }));
}

export async function generateMetadata({ params }: ReleasePageProps): Promise<Metadata> {
    const { slug } = await params;
    const release = await getRelease(slug);
    if (!release) return {};

    return {
        title: release.version ? `${release.version} — Changelog` : release.title,
        description: release.summary ?? undefined,
    };
}

export default async function ReleasePage({ params }: ReleasePageProps) {
    const { slug } = await params;
    const [release, releases] = await Promise.all([getRelease(slug), getReleases()]);
    if (!release) notFound();

    const index = releases.findIndex((entry) => entry.slug === slug);
    const newer = index > 0 ? releases[index - 1] : undefined;
    const older = index >= 0 && index < releases.length - 1 ? releases[index + 1] : undefined;

    return (
        <main className="min-h-screen bg-ink">
            <LandingNavbar />

            <div className={cn(landingContainer, "pt-36 pb-20")}>
                <Link
                    href="/change-log"
                    className="font-mono text-[11px] tracking-widest text-mist/40 uppercase transition-colors hover:text-snow"
                >
                    ← Changelog
                </Link>

                <div className="mt-10">
                    <ReleaseSection release={release} />
                </div>

                <div className="mt-20">
                    <EntryNav
                        previous={
                            older
                                ? { href: `/change-log/${older.slug}`, label: older.title }
                                : undefined
                        }
                        next={
                            newer
                                ? { href: `/change-log/${newer.slug}`, label: newer.title }
                                : undefined
                        }
                    />
                </div>
            </div>

            <LandingFooter />
        </main>
    );
}
