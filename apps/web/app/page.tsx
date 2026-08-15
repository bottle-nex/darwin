import LandingBentoCards from "@/components/landing/LandingBentoCards";
import LandingFeatureShowcase from "@/components/landing/LandingFeatureShowcase";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHero from "@/components/landing/LandingHero";
import LandingIssueTracker from "@/components/landing/LandingIssueTracker";
import LandingPlatformStack from "@/components/landing/LandingPlatformStack";
import { LandingNavbar } from "@/components/new/LandingNavbar";

export default function Home() {
    return (
        <div data-lenis-prevent className="relative min-h-screen w-screen flex flex-col pb-6">
            {/* <DitherHero /> */}
            <LandingNavbar />
            {/* <LandingAiEra /> */}
            <LandingHero />
            {/* <LandingIntegrations /> */}
            <LandingBentoCards />
            <LandingFeatureShowcase />
            <LandingIssueTracker />
            <LandingPlatformStack />
            <LandingFooter />
        </div>
    );
}
