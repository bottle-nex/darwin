import type { Metadata } from "next";

import IntegrationsHero from "@/components/integrations/IntegrationsHero";
import { LandingNavbar } from "@/components/new/LandingNavbar";

export const metadata: Metadata = {
    title: "Integrations · matcha",
    description: "Connect matcha to the tools your team already lives in.",
};

export default function IntegrationsPage() {
    return (
        <main className="min-h-screen">
            <LandingNavbar />
            <IntegrationsHero />
        </main>
    );
}
