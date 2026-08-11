// import { Footer } from "@/components/app/Footer";
// import AmbientDotField from "@/components/backgrounds/AmbientDotField";
// import LandingFeatures from "@/components/new/LandingFeatures";
// import LandingHero from "@/components/new/LandingHero";
// import { LandingNavbar } from "@/components/new/LandingNavbar";

// export default function Home() {
//     return (
//         <div
//             data-lenis-prevent
//             className="relative min-h-screen w-screen flex flex-col bg-primary/5"
//         >
//             <AmbientDotField
//                 className="h-screen"
//                 color="#6d5ad6"
//                 bloomColor="#a394f2"
//                 maxOpacity={0.95}
//                 bloomStrength={0.35}
//                 clearWidthMax={768}
//                 verticalCenter={0.75}
//                 verticalSpread={0.34}
//                 clearTopOffset={300}
//                 capStrength={0.4}
//                 capReach={0.11}
//             />
//             <LandingNavbar />
//             <LandingHero />
//             <LandingFeatures />
//             <Footer />
//         </div>
//     );
// }

import { Footer } from "@/components/app/Footer";
import LandingFeatures from "@/components/new/LandingFeatures";
import { LandingNavbar } from "@/components/new/LandingNavbar";
import LandingNewHero from "@/components/new/LandingNewHero";

export default function Home() {
    return (
        <div
            data-lenis-prevent
            className="relative min-h-screen w-screen flex flex-col bg-snow"
        >
            {/* <AmbientDotField
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
            /> */}
            <LandingNavbar />
            <LandingNewHero />
            {/* <LandingHero /> */}
            <LandingFeatures />
            <Footer />
        </div>
    );
}

// import { Footer } from "@/components/app/Footer";
// import { NavBar } from "@/components/nav/Navbar";
// import LandingHeroV2 from "@/components/landing/v2/LandingHeroV2";
// import BoardShowcase from "@/components/landing/v2/BoardShowcase";
// import FeaturesSection from "@/components/landing/v2/FeaturesSection";
// import CtaSection from "@/components/app/CtaSection";
// import StackCards from "@/components/landing/v2/StackCards";
// import IntegrationsSection from "@/components/landing/v2/IntegrationsSection";

// export default function Home() {
//     return (
//         <main className="flex min-h-screen flex-col bg-ink pt-14">
//             <NavBar isMarkettingPage />
//             <LandingHeroV2 />
//             <BoardShowcase />
//             <FeaturesSection />
//             <IntegrationsSection />
//             <StackCards />
//             <CtaSection />
//             <Footer />
//         </main>
//     );
// }
