import { Footer } from "@/components/app/Footer";
import { NavBar } from "@/components/nav/Navbar";
import LandingHeroV2 from "@/components/landing/v2/LandingHeroV2";
import BoardShowcase from "@/components/landing/v2/BoardShowcase";
import FeaturesSection from "@/components/landing/v2/FeaturesSection";
import LandingPricingSection from "@/components/landing/LandingPricingComponent/LandingPricingSection";
import CtaSection from "@/components/app/CtaSection";
import StackCards from "@/components/landing/v2/StackCards";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col bg-cement pt-14">
            <NavBar isMarkettingPage />
            <LandingHeroV2 />
            <BoardShowcase />
            <FeaturesSection />
            <div id="pricing" className="scroll-mt-20">
                <LandingPricingSection />
            </div>
            <StackCards />
            <CtaSection />
            <Footer />
        </main>
    );
}
