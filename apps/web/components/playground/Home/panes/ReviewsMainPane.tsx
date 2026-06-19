import { FileCheck } from "lucide-react";
import PaneEmptyState from "@/components/playground/core/components/PaneEmptyState";

export default function ReviewsMainPane() {
    return (
        <PaneEmptyState
            icon={FileCheck}
            title="Reviews"
            subtitle="Pull requests awaiting your review will be listed here."
        />
    );
}
