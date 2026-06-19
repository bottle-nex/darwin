import { Clock } from "lucide-react";
import PaneEmptyState from "@/components/playground/core/components/PaneEmptyState";

export default function InProgressPane() {
    return (
        <PaneEmptyState
            icon={Clock}
            title="In Progress"
            subtitle="Work currently being implemented will show up here."
        />
    );
}
