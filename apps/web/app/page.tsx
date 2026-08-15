import LandingHero from "@/components/landing/LandingHero";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingBentoCards from "@/components/landing/LandingBentoCards";
import LandingIssueTracker from "@/components/landing/LandingIssueTracker";
import LandingPlatformStack from "@/components/landing/LandingPlatformStack";
import LandingFeatureShowcase from "@/components/landing/LandingFeatureShowcase";
import { LandingNavbar } from "@/components/new/LandingNavbar";

export default function Home() {
    return (
        <div data-lenis-prevent className="relative min-h-screen w-screen flex flex-col pb-6">
            {/* <DitherHero /> */}
            <LandingNavbar />
            <LandingHero />
            <LandingBentoCards />
            <LandingFeatureShowcase />
            <LandingIssueTracker />
            <LandingPlatformStack />
            <LandingFooter />
        </div>
    );
}
