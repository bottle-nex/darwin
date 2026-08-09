import { Footer } from "@/components/app/Footer";
import AmbientDotField from "@/components/backgrounds/AmbientDotField";
import LandingFeatures from "@/components/new/LandingFeatures";
import LandingHero from "@/components/new/LandingHero";
import { LandingNavbar } from "@/components/new/LandingNavbar";

export default function Home() {
    return (
        <div
            data-lenis-prevent
            className="relative min-h-screen w-screen flex flex-col bg-primary/5"
        >
            <AmbientDotField
                className="h-screen"
                color="#6d5ad6"
                bloomColor="#a394f2"
                maxOpacity={0.95}
                bloomStrength={0.35}
                clearWidthMax={768}
                verticalCenter={0.75}
                verticalSpread={0.34}
                clearTopOffset={300}
                capStrength={0.4}
                capReach={0.11}
            />
            <LandingNavbar />
            <LandingHero />
            <LandingFeatures />
            <Footer />
        </div>
    );
}
