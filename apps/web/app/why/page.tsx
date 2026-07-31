import type { Metadata } from "next";
import { NavBar } from "@/components/nav/Navbar";
import { Footer } from "@/components/app/Footer";
import CtaSection from "@/components/app/CtaSection";
import { WhyHero } from "@/components/why/WhyHero";
import { ManualGruntSection } from "@/components/why/ManualGruntSection";
import { AgentsSection } from "@/components/why/AgentsSection";

export const metadata: Metadata = {
    title: "Why matcha",
    description: "Issues go in, pull requests come out. Why we built a board that empties itself.",
};

export default function WhyPage() {
    return (
        <main className="flex min-h-screen flex-col bg-ink">
            <NavBar isMarkettingPage />
            <WhyHero />
            <ManualGruntSection />
            <AgentsSection />
            <CtaSection />
            <Footer />
        </main>
    );
}
