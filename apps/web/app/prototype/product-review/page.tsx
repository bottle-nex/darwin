import { Suspense } from "react";
import ReviewsDisplay from "@/components/playground/Home/panes/ReviewsDisplay";

// PROTOTYPE — browser entry for evaluating the existing Reviews pane without local API data.
export default function ProductReviewPrototypePage() {
    return (
        <main className="h-dvh bg-neutral-950 p-4">
            <div className="h-full overflow-hidden rounded-lg bg-charcoal ring-1 ring-white/8">
                <Suspense fallback={<div className="h-full bg-charcoal" />}>
                    <ReviewsDisplay />
                </Suspense>
            </div>
        </main>
    );
}
