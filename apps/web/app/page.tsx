import RevampBentoCards from "@/components/revamp/RevampBentoCards";
import RevampFooter from "@/components/revamp/RevampFooter";
import RevampAiEra from "@/components/revamp/RevampAiEra";
import RevampHero from "@/components/revamp/RevampHero";
import RevampIssueTracker from "@/components/revamp/RevampIssueTracker";
import RevampPlatformStack from "@/components/revamp/RevampPlatformStack";
import { LandingNavbar } from "@/components/new/LandingNavbar";
import RevampIntegrations from "@/components/revamp/RevampIntegrations";

export default function Home() {
    return (
        <div
            data-lenis-prevent
            className="relative min-h-screen w-screen flex flex-col bg-ink pb-6"
        >
            {/* <DitherHero /> */}
            <LandingNavbar />
            {/* <RevampAiEra /> */}
            <RevampHero />
            <RevampIntegrations />
            <RevampPlatformStack />
            <RevampIssueTracker />
            {/* <RevampBentoCards /> */}
            <RevampFooter />
        </div>
    );
}
