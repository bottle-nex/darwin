import SectionHeader from "../../utility/SectionHeader";
import PricingFreeCard from "./PricingFreeCard";
import PricingProCard from "./PricingProCard";

export default function LandingPricingSection() {
    return (
        <div className="h-screen w-screen relative overflow-hidden flex flex-col items-center">
            <SectionHeader
                header=""
                title="Pricing that scales with you"
                description="Start exploring for free. Upgrade to Pro when your team is ready for deeper context, faster fixes, and unlimited bug coverage, no contracts, switch anytime."
            />

            <div className="w-full h-full flex p-10 gap-10">
                <PricingFreeCard />
                <PricingProCard />
            </div>
        </div>
    );
}
