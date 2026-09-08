import type { Metadata } from "next";

import FoundersSection from "@/components/about/FoundersSection";
import HowItWorksSection from "@/components/about/HowItWorksSection";
import AboutRevampHero from "@/components/about-revamp/AboutRevampHero";
import CtaSection from "@/components/app/CtaSection";
import { Footer } from "@/components/app/Footer";
import { NavBar } from "@/components/nav/Navbar";

export const metadata: Metadata = {
    title: "About darwin",
    description:
        "The team building agents that turn your board into pull requests. File the issue, review the diff.",
};

export default function AboutPage() {
    return (
        <main className="flex min-h-screen flex-col bg-ink">
            <NavBar isMarkettingPage />
            <AboutRevampHero />
            <HowItWorksSection />
            <FoundersSection />
            <CtaSection />
            <Footer />
        </main>
    );
}
