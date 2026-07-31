import type { Metadata } from "next";
import { Footer } from "@/components/app/Footer";
import HowItWorksSection from "@/components/about/HowItWorksSection";
import FoundersSection from "@/components/about/FoundersSection";
import CtaSection from "@/components/app/CtaSection";
import AboutRevampHero from "@/components/about-revamp/AboutRevampHero";
import { NavBar } from "@/components/nav/Navbar";

export const metadata: Metadata = {
    title: "About matcha",
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
