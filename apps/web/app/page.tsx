import LandingBentoCards from "@/components/landing/LandingBentoCards";
import LandingFeatureShowcase from "@/components/landing/LandingFeatureShowcase";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingIssueTracker from "@/components/landing/LandingIssueTracker";
import LandingPlatformStack from "@/components/landing/LandingPlatformStack";
// import LandingHero from "@/components/landing/LandingHero";
import LandingHero from "@/components/new/LandingHero";
import { LandingNavbar } from "@/components/new/LandingNavbar";
import SkyHero from "@/components/new/SkyHero";

export default function Home() {
    return (
        <div
            data-lenis-prevent
            className="theme-landing relative min-h-screen w-screen flex flex-col pb-6"
        >
            <LandingNavbar />
            <SkyHero />
            <LandingHero />
            <LandingBentoCards />
            <LandingFeatureShowcase />
            <LandingIssueTracker />
            <LandingPlatformStack />
            <LandingFooter />
        </div>
    );
}
