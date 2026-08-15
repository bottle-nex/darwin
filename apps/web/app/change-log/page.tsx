import type { Metadata } from "next";
import { ReleaseSection } from "@trymatcha/editorial";
import ChangeLogHero from "@/components/changelog/ChangeLogHero";
import { LandingNavbar } from "@/components/new/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import { landingContainer } from "@/components/landing/LandingSection";
import { getReleases } from "@/lib/content";

export const metadata: Metadata = {
    title: "Changelog",
    description: "Every release of matcha, newest first.",
};

export default async function ChangeLogPage() {
    const releases = await getReleases();
    return (
        <main data-lenis-prevent className="relative flex min-h-screen w-full flex-col bg-ink pb-6">
            <LandingNavbar />
            <ChangeLogHero />

            <div className={landingContainer}>
                {releases.length === 0 ? (
                    <p className="border-t border-graphite py-16 text-[15px] text-mist/35">
                        No releases published yet.
                    </p>
                ) : (
                    releases.map((release) => (
                        <div key={release.slug} className="border-t border-graphite py-16">
                            <ReleaseSection
                                release={release}
                                href={`/change-log/${release.slug}`}
                            />
                        </div>
                    ))
                )}
            </div>

            <LandingFooter />
        </main>
    );
}
