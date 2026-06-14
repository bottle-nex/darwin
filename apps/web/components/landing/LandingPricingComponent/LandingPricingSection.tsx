import SectionHeader from "../../utility/SectionHeader";
import PricingFreeCard from "./PricingFreeCard";
import PricingProCard from "./PricingProCard";

export default function LandingPricingSection() {
    return (
        <div className="relative flex w-full flex-col items-center overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
            <div className="flex w-full max-w-7xl flex-col">
                <SectionHeader
                    header=""
                    title={
                        <>
                            Pricing that <br />
                            <span className="text-neutral-400">scales with you</span>
                        </>
                    }
                    description="Start exploring for free. Upgrade to Pro when your team is ready for deeper context, faster fixes, and unlimited bug coverage, no contracts, switch anytime."
                />

                <div className="mt-10 flex w-full flex-col gap-6 lg:h-160 lg:flex-row lg:gap-10">
                    <PricingFreeCard />
                    <PricingProCard />
                </div>
            </div>
        </div>
    );
}
