import { LandingNavbar } from "@/components/new/LandingNavbar";
import RevampBentoCards from "@/components/revamp/RevampBentoCards";
import RevampHero from "@/components/revamp/RevampHero";
import RevampIssueTracker from "@/components/revamp/RevampIssueTracker";
import RevampPlatformStack from "@/components/revamp/RevampPlatformStack";

export default function Home() {
    return (
        <div data-lenis-prevent className="relative min-h-screen w-screen flex flex-col bg-ink">
            <LandingNavbar />
            <RevampHero />
            <RevampIssueTracker />
            <RevampBentoCards />
            <RevampPlatformStack />
        </div>
    );
}
