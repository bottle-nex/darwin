import SectionHeader from "../../utility/SectionHeader";
import { cn } from "@/lib/utils";
import PricingStarterCard from "./PricingStarterCard";
import PricingProCard from "./PricingProCard";
import PricingEnterpriseCard from "./PricingEnterpriseCard";

export default function LandingPricingSection() {
    return (
        <div className="h-screen w-full bg-neutral-100 flex flex-col items-center justify-around py-15">
            <SectionHeader
                header="Pricing Plans"
                title="Pay per PR, not per seat"
                description="Pick a plan that matches your team's PR volume. Auto-resolve reviews, lint, and failing CI without taking on more engineers."
            />

            <div className={cn("w-full flex justify-around items-end px-30")}>
                <PricingStarterCard />
                <PricingProCard />
                <PricingEnterpriseCard />
            </div>
        </div>
    );
}
