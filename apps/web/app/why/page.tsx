import type { Metadata } from "next";

import { LandingNavbar } from "@/components/new/LandingNavbar";
import WhyHero from "@/components/why/WhyHero";
import WhyDarwin from "@/components/why/WhyDarwin";

export const metadata: Metadata = {
    title: "Why darwin",
    description: "Issues go in, pull requests come out. Why we built a board that empties itself.",
};

export default function WhyPage() {
    return (
        <main className="flex min-h-screen h-full flex-col bg-ink">
            <LandingNavbar />
            <WhyHero />
            <WhyDarwin />
        </main>
    );
}
