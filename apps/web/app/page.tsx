import { LandingNavbar } from "@/components/new/LandingNavbar";
import RevampHero from "@/components/revamp/RevampHero";
import RevampIssueTracker from "@/components/revamp/RevampIssueTracker";

export default function Home() {
    return (
        <div data-lenis-prevent className="relative min-h-screen w-screen flex flex-col bg-ink">
            <LandingNavbar />
            <RevampHero />
            <RevampIssueTracker />
        </div>
    );
}
