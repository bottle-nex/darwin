import { Sparkles } from "lucide-react";
import PaneEmptyState from "@/components/playground/core/components/PaneEmptyState";

export default function AllRunsPane() {
    return (
        <PaneEmptyState
            icon={Sparkles}
            title="All Runs"
            subtitle="Every agent run across your organization will be listed here."
        />
    );
}
