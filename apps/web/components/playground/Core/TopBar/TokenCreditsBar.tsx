import { cn } from "@/lib/utils";

const TOTAL_BARS = 15;
const SPENT_BARS = 4;

export default function TokenCreditsBar() {
    return (
        <div
            role="meter"
            aria-label="Token credits used"
            aria-valuemin={0}
            aria-valuemax={TOTAL_BARS}
            aria-valuenow={SPENT_BARS}
            className="flex items-center gap-0.75"
        >
            {Array.from({ length: TOTAL_BARS }, (_, index) => (
                <span
                    key={index}
                    className={cn(
                        "h-3.5 w-0.5 shrink-0 rounded-full",
                        index < SPENT_BARS ? "bg-primary" : "bg-overlay/12",
                    )}
                />
            ))}
        </div>
    );
}
