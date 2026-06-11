import type { Metadata } from "next";
import { NavBar } from "@/components/nav/Navbar";
import { Footer } from "@/components/app/Footer";
import AboutHero from "@/components/about/AboutHero";
import StorySection from "@/components/about/StorySection";
import PrinciplesSection from "@/components/about/PrinciplesSection";
import HowItWorksSection from "@/components/about/HowItWorksSection";
import FoundersSection from "@/components/about/FoundersSection";
import AboutCta from "@/components/about/AboutCta";

export const metadata: Metadata = {
    title: "About — matcha",
    description:
        "The team building agents that turn your board into pull requests. File the issue, review the diff.",
};

export default function AboutPage() {
    return (
        <main className="flex min-h-screen flex-col bg-snow pt-14">
            <NavBar />
            <AboutHero />
            <StorySection />
            <PrinciplesSection />
            <HowItWorksSection />
            <FoundersSection />
            <AboutCta />
            <Footer />
        </main>
    );
}
