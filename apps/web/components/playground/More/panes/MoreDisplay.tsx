import { MoreHorizontal } from "lucide-react";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

export default function MoreDisplay() {
    return (
        <PaneEmptyState icon={MoreHorizontal} title="More" subtitle="More options coming soon." />
    );
}
